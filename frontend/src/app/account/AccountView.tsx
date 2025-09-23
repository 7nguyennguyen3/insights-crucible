// src/app/account/AccountView.tsx

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUsageHistory } from "@/hooks/useUsageHistory";
import { useAuthStore } from "@/store/authStore";
import { loadStripe } from "@stripe/stripe-js";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import { auth } from "@/lib/firebaseClient";
import { LibraryManagement } from "@/components/library/LibraryManagement";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  History,
  Settings,
  FileText,
  Mic,
  Loader2,
  FileClock,
  PackagePlus,
  Plus,
  Minus,
  Ticket,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export function AccountView() {
  const { user } = useAuthStore();
  const {
    profile,
    isLoading: isProfileLoading,
    mutateProfile,
  } = useUserProfile();
  const {
    usageHistory,
    error: historyError,
    isLoading: isHistoryLoading,
    isLoadingMore,
    size,
    setSize,
    hasMore,
  } = useUsageHistory();

  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(
    null
  );
  const [quantity, setQuantity] = useState(25);
  // No subscription management state needed for credit-based system
  const [promoCode, setPromoCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const processPaymentSuccess = async () => {
      // Check for the success flag and that the user object is available
      if (searchParams.get("payment_success") && auth.currentUser) {
        toast.success("Payment Successful!", {
          description:
            "Credits have been added to your account!",
        });

        try {
          // Force a refresh of the Firebase Auth ID token.
          const idToken = await auth.currentUser.getIdToken(true);

          // Send the new token to your backend to create a new session cookie
          await apiClient.post("/auth/session-login", { idToken });

          // Now, re-fetch the profile data to update the UI
          await mutateProfile();
        } catch (error) {
          console.error("Failed to refresh session:", error);
          toast.error(
            "Session refresh failed. Please sign in again to see your credits."
          );
        } finally {
          // Clean up the URL
          router.replace("/account", { scroll: false });
        }
      }
    };

    processPaymentSuccess();
  }, [searchParams, user, mutateProfile, router]);

  // No subscription management functions needed for credit-based system

  const handleCreateCheckout = async ({
    priceId,
    quantity = 1,
  }: {
    priceId: string;
    quantity?: number;
  }) => {
    if (!user) {
      router.push("/auth?tab=signin");
      return;
    }
    setIsCheckoutLoading(priceId);
    try {
      const success_url = `${window.location.origin}/account?payment_success=true`;
      const cancel_url = window.location.href;

      const { data } = await apiClient.post(
        "/billing/create-checkout-session",
        { priceId, quantity, success_url, cancel_url }
      );

      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe.js has not loaded yet.");

      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (err) {
      console.error("Failed to create checkout session:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsCheckoutLoading(null);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 25 && newQuantity <= 500) {
      // Increased max to allow for higher purchases
      setQuantity(newQuantity);
    }
  };

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code.");
      return;
    }
    setIsRedeeming(true);
    try {
      // This calls the API route you created
      const response = await apiClient.post("/promo/redeem", {
        code: promoCode,
      });

      toast.success("Promo code redeemed!", {
        description: response.data.message || "Your account has been updated.",
      });

      await mutateProfile(); // This is KEY: it refreshes user data to show the new plan/credits
      setPromoCode(""); // Clear the input field on success
      // You might want to close the dialog here as well
    } catch (err: any) {
      toast.error("Redemption Failed", {
        description: err.response?.data?.error || "Invalid or expired code.",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen w-full">
      <div className="py-24 md:py-32 lg:py-40 container mx-auto px-4">
        <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            My Account
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            View your credit balance, purchase more credits, and manage your job history.
          </p>
        </header>

        {/* Account Summary - Horizontal Layout */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Account Summary</CardTitle>
            <CardDescription>Your current credit balance and account info.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Account Info */}
              <div className="lg:col-span-2 space-y-4">
                <div className="space-y-1">
                  <Label>Email</Label>
                  <div className="text-sm text-slate-700 dark:text-slate-300 h-5">
                    {isProfileLoading ? (
                      <Skeleton className="h-5 w-32" />
                    ) : (
                      user?.email
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Available Credits</Label>
                  <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 h-8 flex items-center">
                    {isProfileLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      (profile?.analyses_remaining ?? 0)
                    )}
                  </div>
                </div>
              </div>

              {/* Credit Packs */}
              <div className="lg:col-span-7">
                <div className="space-y-3">
                  <Label className="font-semibold">Purchase Credit Packs</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Credits never expire. Choose a pack that fits your needs!
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Starter Pack */}
                    <Button
                      variant="secondary"
                      className="h-auto p-4 flex flex-col items-center justify-center space-y-1"
                      onClick={() =>
                        handleCreateCheckout({
                          priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PACK_PRICE_ID!,
                        })
                      }
                      disabled={!!isCheckoutLoading}
                    >
                      <span className="text-sm">30 Credits</span>
                      <span className="text-lg font-bold">$5</span>
                    </Button>

                    {/* Professional Pack */}
                    <Button
                      variant="secondary"
                      className="h-auto p-4 flex flex-col items-center justify-center space-y-1 relative"
                      onClick={() =>
                        handleCreateCheckout({
                          priceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PACK_PRICE_ID!,
                        })
                      }
                      disabled={!!isCheckoutLoading}
                    >
                      <Badge className="absolute -top-2 text-xs">Most Popular</Badge>
                      <span className="text-sm">
                        60{" "}
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          + 15
                        </span>{" "}
                        Credits
                      </span>
                      <span className="text-lg font-bold">$10</span>
                    </Button>

                    {/* Ultimate Pack */}
                    <Button
                      variant="secondary"
                      className="h-auto p-4 flex flex-col items-center justify-center space-y-1 relative"
                      onClick={() =>
                        handleCreateCheckout({
                          priceId: process.env.NEXT_PUBLIC_STRIPE_ULTIMATE_PACK_PRICE_ID!,
                        })
                      }
                      disabled={!!isCheckoutLoading}
                    >
                      <Badge
                        variant="outline"
                        className="absolute -top-2 text-xs border-green-500 text-green-500"
                      >
                        Best Value
                      </Badge>
                      <span className="text-sm">
                        120{" "}
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          + 50
                        </span>{" "}
                        Credits
                      </span>
                      <span className="text-lg font-bold">$20</span>
                    </Button>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <strong>Note:</strong> Bonus credits are included automatically in your total.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="lg:col-span-3 space-y-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Ticket className="mr-2 h-4 w-4" />
                      Have a promo code?
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Redeem a Promo Code</DialogTitle>
                      <DialogDescription>
                        Enter your code below to apply it to your account.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 py-4">
                      <Input
                        id="promoCodeInput"
                        placeholder="e.g. PROUPGRADE"
                        value={promoCode}
                        onChange={(e) =>
                          setPromoCode(e.target.value.toUpperCase())
                        }
                        disabled={isRedeeming}
                      />
                      <Button
                        onClick={handleRedeemPromo}
                        disabled={!promoCode || isRedeeming}
                      >
                        {isRedeeming ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Redeem"
                        )}
                      </Button>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="ghost">Close</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="w-full" asChild>
                  <Link href="/account/setting">
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Library Management - Full Width */}
        <LibraryManagement />

        {/* Analysis History - Full Width */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-6 h-6" />
              <span>Analysis History</span>
            </CardTitle>
            <CardDescription>
              Your most recent analysis jobs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Analysis Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isHistoryLoading && usageHistory.length === 0 ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : historyError ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center h-24 text-red-500"
                    >
                      Could not load analysis history.
                    </TableCell>
                  </TableRow>
                ) : usageHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">
                      <FileClock className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                      <p className="font-semibold">No analyses yet.</p>
                      <p className="text-sm text-slate-500">
                        Run your first analysis to see it here.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  usageHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/results/${record.jobId}`}
                          className="hover:underline"
                        >
                          {record.jobTitle ||
                            `Analysis from ${new Date(
                              record.createdAt
                            ).toLocaleDateString()}`}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            record.type === "audio"
                              ? "default"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {record.type === "audio" ? (
                            <Mic className="w-3 h-3 mr-1" />
                          ) : (
                            <FileText className="w-3 h-3 mr-1" />
                          )}
                          {record.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-500">
                        {new Date(record.createdAt).toLocaleString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => setSize(size + 1)}
                  disabled={isLoadingMore}
                  variant="outline"
                >
                  {isLoadingMore ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
