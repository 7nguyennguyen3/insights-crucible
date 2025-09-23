// src/app/account/page.tsx

import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import admin from "@/lib/firebaseAdmin";

import { AccountView } from "./AccountView";
import { Skeleton } from "@/components/ui/skeleton";
import {
  backgroundVariants,
  containerVariants,
  spacingVariants,
  typographyVariants,
  textGradients,
  gridPatterns,
} from "@/styles/variants";

// A fallback skeleton UI to show while the client component loads
const AccountPageSkeleton = () => {
  return (
    <div
      className={`min-h-screen w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200`}
    >
      <div
        className={`${spacingVariants.heroPadding} ${containerVariants.section}`}
      >
        <header className="text-center mb-16">
          <div className={`${typographyVariants.heroTitle} mb-6`}>
            <Skeleton className="h-16 w-80 mx-auto mb-4" />
            <Skeleton className="h-16 w-64 mx-auto" />
          </div>
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
          </div>
        </header>

        <div className="max-w-7xl mx-auto space-y-8">
          {/* Account Summary Skeleton */}
          <div className="bg-white dark:bg-slate-800 border rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Account Info Skeleton */}
              <div className="lg:col-span-2 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>

              {/* Credit Packs Skeleton */}
              <div className="lg:col-span-7 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-3 w-80" />
              </div>

              {/* Actions Skeleton */}
              <div className="lg:col-span-3 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          {/* Library Management Skeleton */}
          <div className="bg-white dark:bg-slate-800 border rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="space-y-6">
              {/* Stats Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>

              {/* Tags Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-14" />
                  <Skeleton className="h-6 w-18" />
                </div>
              </div>

              {/* Table Skeleton */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-28" />
                </div>
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </div>

          {/* Analysis History Skeleton */}
          <div className="bg-white dark:bg-slate-800 border rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <Skeleton className="h-6 w-36 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-64 w-full" />
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
