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
import { Loader2, Terminal, Shield, CheckCircle2 } from "lucide-react";
import { FaGoogle } from "react-icons/fa6";
import { elevationVariants, textGradients, typographyVariants } from "@/styles/variants";

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
    <div className="w-full max-w-md mx-4">
      {/* Trust Indicators */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 text-sm mb-3">
          <Shield className="w-4 h-4 text-teal-600" />
          <span>Secure & Encrypted</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Free Credits Included</span>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <Card className={`${elevationVariants.floating} bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-stone-200/60 dark:border-amber-900/30`}>
          <CardHeader className="text-center">
            <CardTitle className={`${typographyVariants.cardTitle} text-slate-900 dark:text-slate-100`}>
              {activeTab === "signin" ? "Welcome Back" : "Create an Account"}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              {activeTab === "signin"
                ? "Sign in to access your AI-powered podcast analysis dashboard."
                : "Start transforming podcasts into actionable insights."}
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
              className="w-full h-12 bg-white/70 dark:bg-slate-700/70 hover:bg-white dark:hover:bg-slate-600 border-stone-200 dark:border-stone-600 hover:border-stone-300 dark:hover:border-stone-500 shadow-md hover:shadow-lg transition-all duration-200"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-600 dark:text-slate-400" />
              ) : (
                <FaGoogle className="mr-2 h-5 w-5 text-red-500" />
              )}
              <span className="text-slate-700 dark:text-slate-300">Continue with Google</span>
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-stone-200 dark:border-amber-800/40" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/80 dark:bg-slate-800/80 px-3 py-1 text-slate-500 dark:text-slate-400 rounded-full">
                  Or continue with
                </span>
              </div>
            </div>

            <TabsList className="grid w-full grid-cols-2 bg-stone-100/80 dark:bg-slate-700/80 border border-stone-200/60 dark:border-amber-900/30">
              <TabsTrigger value="signin" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100">Sign Up</TabsTrigger>
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
                className="w-full mt-6 h-12 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                disabled={loading || googleLoading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {activeTab === "signin" ? "Sign In to Dashboard" : "Create Account & Get Started"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
      </Tabs>
      
      {/* Additional Trust Elements */}
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-500 max-w-sm mx-auto leading-relaxed">
          By continuing, you agree to our Terms of Service and Privacy Policy. 
          Your data is encrypted and secure.
        </p>
      </div>
    </div>
  );
}
