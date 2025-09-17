// app/api/library/my-contributions/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { LibraryManagementEntry, LibraryStats } from "@/types/library";

/**
 * GET: Get user's library contributions and stats
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    // Get user's jobs that are in the library
    const jobsSnapshot = await db
      .collection(`saas_users/${userId}/jobs`)
      .where("libraryMeta.libraryEnabled", "==", true)
      .orderBy("libraryMeta.addedToLibraryAt", "desc")
      .get();

    const contributions: LibraryManagementEntry[] = jobsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        jobId: doc.id,
        title: data.job_title,
        description: data.libraryMeta?.libraryDescription || '',
        tags: data.libraryMeta?.libraryTags || [],
        category: data.libraryMeta?.libraryCategory,
        viewCount: data.viewCount || 0,
        addedToLibraryAt: data.libraryMeta?.addedToLibraryAt,
        lastUpdated: data.libraryMeta?.lastUpdated
      };
    });

    // Calculate stats
    const totalEntries = contributions.length;
    const totalViews = contributions.reduce((sum, entry) => sum + entry.viewCount, 0);

    // Get popular tags from user's contributions
    const tagCounts: { [tag: string]: number } = {};
    contributions.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get recent activity (simplified - could be enhanced with actual activity tracking)
    const recentActivity = contributions
      .slice(0, 5)
      .map(entry => ({
        type: 'add' as const,
        jobId: entry.jobId,
        title: entry.title,
        timestamp: entry.addedToLibraryAt
      }));

    const stats: LibraryStats = {
      totalEntries,
      totalViews,
      popularTags,
      recentActivity
    };

    return NextResponse.json({
      contributions,
      stats
    });
  } catch (error) {
    console.error("Error fetching user library contributions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}