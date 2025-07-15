// src/app/account/page.tsx

import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import admin from "@/lib/firebaseAdmin";

import { AccountView } from "./AccountView";
import { Skeleton } from "@/components/ui/skeleton";

// A fallback skeleton UI to show while the client component loads
const AccountPageSkeleton = () => {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Skeleton className="h-[500px] w-full" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-[500px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

// This page is now an async function to allow for server-side checks
export default async function AccountPage() {
  const sessionCookie = (await cookies()).get("session")?.value;

  // If the cookie is missing, redirect immediately to the auth page
  if (!sessionCookie) {
    redirect("/auth");
  }

  // If the cookie exists, try to verify it
  try {
    // This will throw an error if the cookie is invalid or expired
    await admin.auth().verifySessionCookie(sessionCookie, true);
  } catch (error) {
    // Cookie is invalid, so redirect to the login page
    console.error("Invalid session cookie on account page:", error);
    redirect("/auth");
  }

  // If the cookie is valid, proceed to render the page with the Suspense boundary
  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <AccountView />
    </Suspense>
  );
}
