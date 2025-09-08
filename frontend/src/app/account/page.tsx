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
      className={`min-h-screen w-full ${backgroundVariants.universal} text-slate-800 dark:text-slate-200 relative overflow-hidden`}
    >
      {/* Background Elements */}
      <div className={`absolute inset-0 ${gridPatterns.subtle}`} />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      <div
        className={`relative ${spacingVariants.heroPadding} ${containerVariants.section}`}
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

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-[400px] w-full" />
              <Skeleton className="h-[300px] w-full" />
            </div>
            <div className="lg:col-span-1 lg:sticky top-24 space-y-6">
              <Skeleton className="h-[500px] w-full" />
            </div>
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
