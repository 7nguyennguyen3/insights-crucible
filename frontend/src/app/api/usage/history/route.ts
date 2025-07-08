import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { Timestamp } from "firebase-admin/firestore";

// 1. Renamed to BreakdownMetrics and updated fields to match the database
export interface BreakdownMetrics {
  assemblyai_seconds?: number;
  final_billed_usd?: number;
  llm_input_tokens?: number;
  llm_output_tokens?: number;
  plan_discount_usd?: number;
  pre_discount_cost_usd?: number;
  tavily_searches?: number; // This can be deprecated or renamed if you now have basic/advanced
  tavily_basic_searches?: number; // <-- ADD THIS NEW FIELD
  tavily_advanced_searches?: number; // This was from a previous request
}

// 2. Updated UsageRecord to use the correct 'breakdown' field
export interface UsageRecord {
  id: string;
  jobId: string | null;
  jobTitle: string;
  userId: string;
  type: "audio" | "text" | "credit";
  usageMetric: number | null;
  costInUSD: number;
  breakdown?: BreakdownMetrics; // <-- Use the correct field name and type
  createdAt: string;
}

const PAGE_SIZE = 10;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const { cursor } = await request.json();

    let usageQuery = db
      .collection("usage_records")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(PAGE_SIZE);

    if (cursor) {
      usageQuery = usageQuery.startAfter(Timestamp.fromMillis(cursor));
    }

    const usageSnapshot = await usageQuery.get();

    if (usageSnapshot.empty) {
      return NextResponse.json({ records: [], hasMore: false });
    }

    const jobTitlePromises: Promise<{ docId: string; title: string }>[] = [];
    const initialRecords = usageSnapshot.docs.map((doc) => {
      const data = doc.data();
      if (data.jobId) {
        jobTitlePromises.push(
          db
            .collection(`saas_users/${userId}/jobs`)
            .doc(data.jobId)
            .get()
            .then((jobDoc) => ({
              docId: doc.id,
              title: jobDoc.data()?.job_title || "Untitled Analysis",
            }))
        );
      }
      return { id: doc.id, ...data };
    });

    const jobTitles = await Promise.all(jobTitlePromises);
    const jobTitleMap = new Map(
      jobTitles.map((item) => [item.docId, item.title])
    );

    // 3. Updated mapping logic to use 'breakdown'
    const finalRecords: UsageRecord[] = initialRecords.map((record: any) => {
      return {
        id: record.id,
        jobId: record.jobId || null,
        jobTitle: record.jobId
          ? jobTitleMap.get(record.id) || "Untitled Analysis"
          : record.jobTitle || "Credit Purchase",
        userId: record.userId,
        type: record.type,
        usageMetric: record.usageMetric || null,
        costInUSD: record.costInUSD,
        breakdown: record.breakdown || undefined, // <-- Pass the correct field
        createdAt: record.createdAt.toDate().toISOString(),
      };
    });

    const hasMore = finalRecords.length === PAGE_SIZE;
    return NextResponse.json({ records: finalRecords, hasMore });
  } catch (error) {
    console.error("Error fetching usage history:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
