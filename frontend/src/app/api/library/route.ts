// app/api/library/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { LibraryEntry, LibraryFilters, LibraryResponse } from "@/types/library";

/**
 * GET: Browse public library analyses with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters: LibraryFilters = {
      search: searchParams.get("search") || undefined,
      tags: searchParams.get("tags")?.split(",").filter(Boolean) || undefined,
      category: searchParams.get("category") || undefined,
      sourceType: (searchParams.get("sourceType") as any) || undefined,
      sortBy: (searchParams.get("sortBy") as any) || "newest",
      page: parseInt(searchParams.get("page") || "1"),
      limit: Math.min(parseInt(searchParams.get("limit") || "12"), 50), // Max 50 per page
    };

    // Build query for library entries
    let query = db
      .collectionGroup("jobs")
      .where("isPublic", "==", true)
      .where("libraryMeta.libraryEnabled", "==", true);

    // Apply filters
    if (filters.sourceType) {
      query = query.where("sourceType", "==", filters.sourceType);
    }

    if (filters.category) {
      query = query.where(
        "libraryMeta.libraryCategory",
        "==",
        filters.category
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "newest":
        query = query.orderBy("libraryMeta.addedToLibraryAt", "desc");
        break;
      case "oldest":
        query = query.orderBy("libraryMeta.addedToLibraryAt", "asc");
        break;
      case "mostViewed":
        query = query.orderBy("viewCount", "desc");
        break;
      case "title":
        query = query.orderBy("job_title", "asc");
        break;
      default:
        query = query.orderBy("libraryMeta.addedToLibraryAt", "desc");
    }

    // Execute query
    const snapshot = await query.get();
    let jobs = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ref: doc.ref, // Include the document reference
          ...doc.data(),
        }) as any
    );

    // Apply search filter (client-side for flexibility)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      jobs = jobs.filter(
        (job) =>
          job.job_title?.toLowerCase().includes(searchLower) ||
          job.libraryMeta?.libraryDescription
            ?.toLowerCase()
            .includes(searchLower) ||
          job.libraryMeta?.libraryTags?.some((tag: string) =>
            tag.toLowerCase().includes(searchLower)
          )
      );
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      jobs = jobs.filter((job) =>
        filters.tags!.some((filterTag) =>
          job.libraryMeta?.libraryTags?.includes(filterTag)
        )
      );
    }

    // Get total count
    const total = jobs.length;

    // Apply pagination
    const startIndex = ((filters.page || 1) - 1) * (filters.limit || 12);
    const endIndex = startIndex + (filters.limit || 12);
    const paginatedJobs = jobs.slice(startIndex, endIndex);

    // Transform to LibraryEntry format
    const entries: LibraryEntry[] = await Promise.all(
      paginatedJobs.map(async (job) => {
        // Get user info for creator
        const userPath = job.ref?.path.split("/").slice(0, 2).join("/");

        let creator = {
          userId: userPath?.split("/")[1] || "unknown",
          displayName: "Anonymous User",
          avatar: undefined,
        };

        if (userPath) {
          try {
            const userDoc = await db.doc(userPath).get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              creator = {
                userId: creator.userId,
                displayName:
                  userData?.displayName || userData?.name || "Anonymous User",
                avatar: userData?.photoURL || undefined,
              };
            }
          } catch (error) {
            console.warn("Could not fetch creator info:", error);
          }
        }

        // Generate preview data
        const previewData = {
          sampleQuote:
            job.results?.[0]?.actionable_takeaways?.[0]?.supporting_quote ||
            undefined,
          keyInsight: job.results?.[0]?.["1_sentence_summary"] || undefined,
          takeawayCount:
            job.results?.reduce(
              (total: number, section: any) =>
                total + (section.actionable_takeaways?.length || 0),
              0
            ) || 0,
        };

        return {
          id: job.id,
          publicShareId: job.publicShareId,
          title: job.job_title,
          description: job.libraryMeta?.libraryDescription || "",
          tags: job.libraryMeta?.libraryTags || [],
          category: job.libraryMeta?.libraryCategory,
          creator,
          viewCount: job.viewCount || 0,
          createdAt:
            job.createdAt || job.created_at || new Date().toISOString(),
          addedToLibraryAt:
            job.libraryMeta?.addedToLibraryAt || new Date().toISOString(),
          analysisPersona:
            job.request_data?.config?.analysis_persona || "deep_dive",
          duration: job.durationSeconds,
          sourceType:
            job.request_data?.source_type || job.sourceType || "upload",
          thumbnailUrl: job.request_data?.youtube_thumbnail_url,
          // YouTube-specific metadata
          youtubeVideoTitle: job.request_data?.youtube_video_title,
          youtubeChannelName: job.request_data?.youtube_channel_name,
          youtubeUrl: job.request_data?.youtube_url,
          previewData,
        };
      })
    );

    // Get available filters for frontend
    const allJobs = snapshot.docs.map((doc) => doc.data());
    const availableTags = [
      ...new Set(allJobs.flatMap((job) => job.libraryMeta?.libraryTags || [])),
    ].sort();

    const availableCategories = [
      ...new Set(
        allJobs.map((job) => job.libraryMeta?.libraryCategory).filter(Boolean)
      ),
    ].sort();

    const response: LibraryResponse = {
      entries,
      total,
      page: filters.page || 1,
      totalPages: Math.ceil(total / (filters.limit || 12)),
      availableTags,
      availableCategories,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching library entries:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
