"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

// This is the Higher-Order Component
const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const AuthComponent = (props: P) => {
    const router = useRouter();
    const { user, loading } = useAuthStore();
    const [countdown, setCountdown] = useState(7);

    useEffect(() => {
      // Don't run the redirect logic while the auth state is loading.
      if (loading) {
        return;
      }

      // If the check is complete and there's no user, start the redirect countdown.
      if (!user) {
        // Timer to handle the actual redirection after 7 seconds.
        const redirectTimer = setTimeout(() => {
          router.replace("/auth");
        }, 7000);

        // Interval to update the countdown display every second.
        const countdownInterval = setInterval(() => {
          setCountdown((prevCountdown) =>
            prevCountdown > 0 ? prevCountdown - 1 : 0
          );
        }, 1000);

        // Cleanup function: This is critical.
        // It clears the timers if the component unmounts or dependencies change.
        return () => {
          clearTimeout(redirectTimer);
          clearInterval(countdownInterval);
        };
      }
    }, [user, loading, router]);

    // 1. While Firebase is checking the auth state, show a loading screen.
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-950">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      );
    }

    // 2. If the user is logged in, render the page they were trying to access.
    if (user) {
      return <WrappedComponent {...props} />;
    }

    // 3. If the user is not logged in, show a message and a countdown.
    // This replaces the previous `return null;`
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-950 text-center p-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
          Please Log In
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          You must be logged in to view this page.
        </p>
        <p className="text-lg text-slate-500 dark:text-slate-500">
          You will be redirected in{" "}
          <span className="font-bold text-blue-500 w-6 inline-block">
            {countdown}
          </span>{" "}
          seconds...
        </p>
      </div>
    );
  };

  // Set a display name for the component for better debugging
  AuthComponent.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return AuthComponent;
};

export default withAuth;
