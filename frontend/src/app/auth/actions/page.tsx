// app/auth/actions/page.tsx

"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ActionHandler() {
  const router = useRouter();
  const [message, setMessage] = useState("Verifying your request...");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);

  useEffect(() => {
    const completeSignIn = async (emailToSignIn: string) => {
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        setError("This is not a valid sign-in link.");
        return;
      }

      setMessage("Signing you in...");

      try {
        const userCredential = await signInWithEmailLink(
          auth,
          emailToSignIn,
          window.location.href
        );

        // We now have the user signed in on the client.
        // Let's create our secure server-side session cookie.
        const idToken = await userCredential.user.getIdToken();
        await axios.post("/api/auth/session-login", { idToken });

        // Clean up the stored email
        window.localStorage.removeItem("emailForSignIn");

        setMessage("Success! Redirecting you to the dashboard...");
        window.location.href = "/dashboard";
      } catch (err) {
        console.error(err);
        setError(
          "This sign-in link is invalid, has expired, or has already been used."
        );
      }
    };

    const storedEmail = window.localStorage.getItem("emailForSignIn");
    if (storedEmail) {
      completeSignIn(storedEmail);
    } else {
      // Fallback if the email is not in localStorage (e.g., user opened on a different device)
      setShowEmailInput(true);
    }
  }, [router]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setShowEmailInput(false);
      setMessage("Verifying your request...");
      const completeSignIn = async (emailToSignIn: string) => {
        // ... (duplicate logic as above for simplicity, could be refactored)
        if (!isSignInWithEmailLink(auth, window.location.href)) {
          setError("Invalid link.");
          return;
        }
        setMessage("Signing you in...");
        try {
          const userCredential = await signInWithEmailLink(
            auth,
            emailToSignIn,
            window.location.href
          );
          const idToken = await userCredential.user.getIdToken();
          await axios.post("/api/auth/session-login", { idToken });
          router.push("/dashboard");
        } catch (err) {
          setError("Link is invalid or expired.");
        }
      };
      completeSignIn(email);
    }
  };

  if (showEmailInput) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h1 className="text-2xl font-bold">Confirm Your Email</h1>
        <p className="mt-2 text-slate-600">
          To complete sign-in, please provide the email address you used.
        </p>
        <form
          onSubmit={handleEmailSubmit}
          className="mt-4 space-y-4 w-full max-w-sm"
        >
          <div className="text-left">
            <Label htmlFor="email-confirm">Email Address</Label>
            <Input
              id="email-confirm"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Continue Sign In
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      {error ? (
        <>
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2 text-slate-600">{error}</p>
        </>
      ) : (
        <>
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <h1 className="text-2xl font-bold mt-4">{message}</h1>
        </>
      )}
    </div>
  );
}

// Wrap the component in Suspense because useSearchParams requires it.
export default function ActionHandlerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ActionHandler />
    </Suspense>
  );
}
