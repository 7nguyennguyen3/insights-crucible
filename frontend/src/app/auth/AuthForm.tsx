// src/app/auth/AuthForm.tsx

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import {
  getAdditionalUserInfo,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

// UI Imports
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Terminal } from "lucide-react";
import { FaGoogle } from "react-icons/fa6";

export function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter(); // ⬅️ ADDED
  const initialTab = searchParams.get("tab") || "signin";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
  }, [activeTab]);

  const handleSessionLogin = async (idToken: string) => {
    await axios.post("/api/auth/session-login", { idToken });
    window.location.href = "/dashboard";
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (activeTab === "signup") {
        // --- Sign-Up Logic ---
        await axios.post("/api/auth/signup", { name, email, password });
        window.localStorage.setItem("emailForSignIn", email);
        // After successful creation, redirect to the verify page instead of logging in.
        router.push("/auth/please-verify"); // ⬅️ MODIFIED
      } else {
        // --- Sign-In Logic ---
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        // ⬇️ ADDED: This is the crucial verification check
        if (!userCredential.user.emailVerified) {
          setError(
            "Your email has not been verified. Please check your inbox."
          );
          setLoading(false); // Stop loading indicator
          return; // Stop the function here
        }

        // If verified, proceed with login
        const idToken = await userCredential.user.getIdToken();
        await handleSessionLogin(idToken);
      }
    } catch (err: any) {
      const defaultError = "An unexpected error occurred. Please try again.";
      const errorMsg =
        err.response?.data?.message || err.message || defaultError;
      setError(errorMsg);
      console.error(err);
    } finally {
      // Don't set loading to false if we are redirecting from signup
      if (activeTab !== "signup") {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const additionalUserInfo = getAdditionalUserInfo(result);

      if (additionalUserInfo?.isNewUser) {
        await axios.post("/api/auth/social-signin", {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
        });
      }

      const idToken = await user.getIdToken();
      await handleSessionLogin(idToken);
    } catch (err: any) {
      setError("Failed to sign in with Google. Please try again.");
      console.error("Google Sign-In Error:", err);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full max-w-md mx-4"
    >
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {activeTab === "signin" ? "Welcome Back" : "Create an Account"}
          </CardTitle>
          <CardDescription>
            {activeTab === "signin"
              ? "Sign in to access your dashboard."
              : "Enter your details to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Authentication Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FaGoogle className="mr-2 h-5 w-5" />
              )}
              Continue with Google
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <form onSubmit={handleEmailPasswordSubmit}>
              <TabsContent value="signin" className="space-y-4">
                {/* Sign In Form Fields */}
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
                  <Input
                    id="email-signin"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">Password</Label>
                  <Input
                    id="password-signin"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                {/* Sign Up Form Fields */}
                <div className="space-y-2">
                  <Label htmlFor="name-signup">Name</Label>
                  <Input
                    id="name-signup"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input
                    id="password-signup"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                  />
                </div>
              </TabsContent>

              <Button
                type="submit"
                className="w-full mt-4"
                disabled={loading || googleLoading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {activeTab === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </Tabs>
  );
}
