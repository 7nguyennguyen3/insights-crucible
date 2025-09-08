// src/app/auth/page.tsx

import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AuthForm } from "./AuthForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import admin from "@/lib/firebaseAdmin";
import { backgroundVariants, gridPatterns } from "@/styles/variants";

export default async function AuthPage() {
  const sessionCookie = (await cookies()).get("session")?.value;

  if (sessionCookie) {
    let isCookieValid = false;
    try {
      // ✅ Only wrap the verification in the try...catch
      await admin.auth().verifySessionCookie(sessionCookie, true);
      isCookieValid = true;
    } catch (error) {
      // Cookie is invalid or expired. Silently proceed to show the login form.
      // The console.error is optional here as this is an expected path.
    }

    if (isCookieValid) {
      redirect("/dashboard");
    }
  }

  // If no cookie exists, or if the cookie was invalid, render the form.
  return (
    <div className={`flex items-center justify-center min-h-screen ${backgroundVariants.universal} relative overflow-hidden`}>
      {/* Background Elements */}
      <div className={`absolute inset-0 ${gridPatterns.subtle}`} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl animate-pulse" />
      <div 
        className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-teal-500/8 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />
      
      <div className="relative z-10">
        <React.Suspense fallback={<AuthSkeleton />}>
          <AuthForm />
        </React.Suspense>
      </div>
    </div>
  );
}

function AuthSkeleton() {
  return (
    <Card className="w-full max-w-md mx-4">
      <CardHeader className="text-center space-y-3">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-5 w-64 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 mt-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-4 pt-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full mt-4" />
      </CardContent>
    </Card>
  );
}
