// src/app/api/cron/reset-analyses/route.ts
// NOTE: This endpoint is deprecated in the credit-based model
// Credits never expire and don't require monthly resets

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Secure the endpoint
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // In the credit-based model, credits never expire and don't need monthly resets
  console.log("Credit reset cron called, but no action needed in credit-based model.");
  
  return NextResponse.json({
    success: true,
    message: "No action required - credits never expire in the new model.",
    deprecated: true,
    note: "This endpoint should be removed from cron schedule as credits no longer reset monthly.",
  });
}
