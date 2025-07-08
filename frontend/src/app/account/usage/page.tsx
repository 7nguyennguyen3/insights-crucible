"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUsageHistory } from "@/hooks/useUsageHistory";
import { loadStripe } from "@stripe/stripe-js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  History,
  HelpCircle,
  FileText,
  Mic,
  Sparkles,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import type { UsageRecord } from "@/app/api/usage/history/route";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const UsagePage = () => {
  const {
    usageHistory,
    error,
    isLoading,
    isLoadingMore,
    size,
    setSize,
    hasMore,
    mutate: mutateHistory,
  } = useUsageHistory();

  const {
    profile,
    isLoading: isProfileLoading,
    mutateProfile,
  } = useUserProfile();

  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(
    null
  );
  const [customAmount, setCustomAmount] = useState<string>("5.00");

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("payment_success")) {
      toast.success("Payment successful!", {
        description: "Your credits have been added to your account.",
      });
      mutateProfile();
      mutateHistory();
      router.replace("/account/usage", { scroll: false });
    }
  }, [searchParams, mutateProfile, mutateHistory, router]);

  const handleCreateCheckout = async ({
    priceId,
    customAmount,
  }: {
    priceId?: string;
    customAmount?: number;
  }) => {
    const loadingKey = priceId || `custom-${customAmount}`;
    setIsCheckoutLoading(loadingKey);
    try {
      const success_url = `${window.location.origin}/account/usage?payment_success=true`;
      const cancel_url = window.location.href;
      const { data } = await apiClient.post(
        "/billing/create-checkout-session",
        { priceId, customAmount, success_url, cancel_url }
      );
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe.js not loaded");
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
      if (error) console.error("Stripe redirect error:", error.message);
    } catch (err) {
      console.error("Failed to create checkout session:", err);
      toast.error("Could not create checkout session.");
    } finally {
      setIsCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsCheckoutLoading("manage");
    try {
      const { data } = await apiClient.post("/billing/create-portal-session");
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Could not retrieve billing portal URL.");
      }
    } catch (err) {
      console.error("Failed to create portal session:", err);
      toast.error("Could not open billing portal.");
    } finally {
      setIsCheckoutLoading(null);
    }
  };

  const formatUsageMetric = (record: UsageRecord) => {
    if (record.type === "credit") return "N/A";
    if (typeof record.usageMetric !== "number") return "N/A";
    if (record.type === "audio")
      return `${Math.floor(record.usageMetric / 60)}m ${Math.round(
        record.usageMetric % 60
      )}s`;
    if (record.type === "text")
      return `${record.usageMetric.toLocaleString()} chars`;
    return record.usageMetric;
  };

  // --- REWRITTEN RENDERBREAKDOWN FUNCTION ---
  const renderBreakdown = (record: UsageRecord) => {
    if (record.type === "credit") {
      return <p className="text-xs">Adds credits to your account balance.</p>;
    }

    const metrics = record.breakdown;

    if (!metrics) {
      return <p className="text-xs">No detailed cost breakdown available.</p>;
    }

    const formatCost = (cost: number) => `$${cost.toFixed(6)}`;

    const llmInputCost = (metrics.llm_input_tokens || 0) * 0.0000003;
    const llmOutputCost = (metrics.llm_output_tokens || 0) * 0.0000006;
    const tavilyBasicCost = (metrics.tavily_basic_searches || 0) * 0.008;
    const tavilyAdvancedCost = (metrics.tavily_advanced_searches || 0) * 0.016;
    const assemblyAiCost = (metrics.assemblyai_seconds || 0) * 0.0003;

    return (
      <div className="space-y-3 text-xs p-1">
        {/* Language Model Costs */}
        {(llmInputCost > 0 || llmOutputCost > 0) && (
          <div>
            <p className="font-bold">Language Model</p>
            <p className="text-slate-400 text-[10px] mb-1">
              For summarization, analysis, and content generation.
            </p>
            <ul className="space-y-1">
              {llmInputCost > 0 && (
                <li className="flex justify-between">
                  <span>
                    Input Tokens ({metrics.llm_input_tokens?.toLocaleString()})
                  </span>
                  <span className="font-mono">{formatCost(llmInputCost)}</span>
                </li>
              )}
              {llmOutputCost > 0 && (
                <li className="flex justify-between">
                  <span>
                    Output Tokens ({metrics.llm_output_tokens?.toLocaleString()}
                    )
                  </span>
                  <span className="font-mono">{formatCost(llmOutputCost)}</span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Web Search Costs */}
        {(tavilyBasicCost > 0 || tavilyAdvancedCost > 0) && (
          <div>
            <p className="font-bold">Web Search</p>
            <p className="text-slate-400 text-[10px] mb-1">
              For contextual research and fact-checking.
            </p>
            <ul className="space-y-1">
              {tavilyBasicCost > 0 && (
                <li className="flex justify-between">
                  <span>
                    Basic Searches (
                    {metrics.tavily_basic_searches?.toLocaleString()})
                  </span>
                  <span className="font-mono">
                    {formatCost(tavilyBasicCost)}
                  </span>
                </li>
              )}
              {tavilyAdvancedCost > 0 && (
                <li className="flex justify-between">
                  <span>
                    Advanced Searches (
                    {metrics.tavily_advanced_searches?.toLocaleString()})
                  </span>
                  <span className="font-mono">
                    {formatCost(tavilyAdvancedCost)}
                  </span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Audio Transcription Costs */}
        {assemblyAiCost > 0 && (
          <div>
            <p className="font-bold">Audio Transcription</p>
            <p className="text-slate-400 text-[10px] mb-1">
              For converting speech to text.
            </p>
            <ul className="space-y-1">
              <li className="flex justify-between">
                <span>
                  Audio Duration ({metrics.assemblyai_seconds?.toLocaleString()}
                  s)
                </span>
                <span className="font-mono">{formatCost(assemblyAiCost)}</span>
              </li>
            </ul>
          </div>
        )}

        {/* Final Calculation Summary */}
        <div className="pt-2 border-t border-slate-600">
          <ul className="space-y-1">
            {metrics.pre_discount_cost_usd &&
              metrics.pre_discount_cost_usd > 0 && (
                <li className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">
                    {formatCost(metrics.pre_discount_cost_usd)}
                  </span>
                </li>
              )}
            {metrics.plan_discount_usd && metrics.plan_discount_usd > 0 && (
              <li className="flex justify-between">
                <span>Pro Plan Discount:</span>
                <span className="font-mono text-cyan-400">
                  -{formatCost(metrics.plan_discount_usd)}
                </span>
              </li>
            )}
            {metrics.final_billed_usd && metrics.final_billed_usd > 0 && (
              <li className="flex justify-between font-bold pt-1 border-t border-dashed border-slate-600">
                <span>Final Billed Amount:</span>
                <span className="font-mono">
                  {formatCost(metrics.final_billed_usd)}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8 mb-20">
        <header>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Usage & Billing
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            Track your analysis costs and manage your account credits.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-500" />
                <span>Your Credits</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isProfileLoading ? (
                <Skeleton className="h-10 w-48" />
              ) : (
                <p className="text-4xl font-bold">
                  ${(profile?.credits || 0).toFixed(4)}
                </p>
              )}
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Remaining credits to use for analysis.
              </p>
            </CardContent>
          </Card>

          {profile?.plan === "pro" ? (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-500" />
                  <span>Pro Plan Active</span>
                </CardTitle>
                <CardDescription>
                  Manage your subscription and billing details in the portal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={handleManageSubscription}
                  disabled={isCheckoutLoading !== null}
                >
                  {isCheckoutLoading === "manage" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Manage Subscription"
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-lg border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-6 h-6" />
                  <span>Upgrade to Pro</span>
                </CardTitle>
                <CardDescription>
                  Get more credits and a discount on all usage.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() =>
                    handleCreateCheckout({
                      priceId:
                        process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID!,
                    })
                  }
                  disabled={isCheckoutLoading !== null}
                >
                  {isCheckoutLoading ===
                  process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Upgrade to Pro - $10/month"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              <span>Buy More Credits</span>
            </CardTitle>
            <CardDescription>
              Top up your account with a one-time purchase.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() =>
                  handleCreateCheckout({
                    priceId: process.env.NEXT_PUBLIC_STRIPE_5_DOLLAR_PRICE_ID!,
                  })
                }
                disabled={isCheckoutLoading !== null}
                className="flex-1"
              >
                {isCheckoutLoading ===
                process.env.NEXT_PUBLIC_STRIPE_5_DOLLAR_PRICE_ID ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Buy $5 Credits"
                )}
              </Button>
              <Button
                onClick={() =>
                  handleCreateCheckout({
                    priceId: process.env.NEXT_PUBLIC_STRIPE_10_DOLLAR_PRICE_ID!,
                  })
                }
                disabled={isCheckoutLoading !== null}
                className="flex-1"
              >
                {isCheckoutLoading ===
                process.env.NEXT_PUBLIC_STRIPE_10_DOLLAR_PRICE_ID ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Buy $10 Credits"
                )}
              </Button>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <span className="text-sm text-slate-500">Or</span>
              <hr className="flex-grow border-slate-200 dark:border-slate-700" />
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-slate-400" />
              <Input
                type="number"
                placeholder="Custom amount"
                min="1.00"
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="max-w-xs"
                disabled={isCheckoutLoading !== null}
              />
              <Button
                onClick={() =>
                  handleCreateCheckout({
                    customAmount: parseFloat(customAmount),
                  })
                }
                disabled={
                  isCheckoutLoading !== null || parseFloat(customAmount) < 1
                }
              >
                {isCheckoutLoading === `custom-${customAmount}` ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Buy Credits"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-6 h-6" />
              <span>Usage History</span>
            </CardTitle>
            <CardDescription>
              Showing your most recent transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Usage Metric</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && usageHistory.length === 0 ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center h-24 text-red-500"
                      >
                        Could not load usage history.
                      </TableCell>
                    </TableRow>
                  ) : usageHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        No transactions yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    usageHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            {record.jobId ? (
                              <Link
                                href={`/results/${record.jobId}`}
                                className="font-medium hover:underline"
                              >
                                {record.jobTitle}
                              </Link>
                            ) : (
                              <span className="font-medium">
                                {record.jobTitle}
                              </span>
                            )}
                            <span className="text-xs text-slate-500">
                              {new Date(record.createdAt).toLocaleString([], {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.type === "audio"
                                ? "default"
                                : record.type === "text"
                                ? "secondary"
                                : "outline"
                            }
                            className="capitalize"
                          >
                            {record.type === "audio" && (
                              <Mic className="w-3 h-3 mr-1" />
                            )}
                            {record.type === "text" && (
                              <FileText className="w-3 h-3 mr-1" />
                            )}
                            {record.type === "credit" && (
                              <Sparkles className="w-3 h-3 mr-1" />
                            )}
                            {record.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatUsageMetric(record)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono ${
                            record.type === "credit"
                              ? "text-green-600 dark:text-green-500"
                              : "text-red-600 dark:text-red-500"
                          }`}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-pointer flex justify-end items-center gap-1">
                                {record.type === "credit" ? "+" : "-"}$
                                {Math.abs(record.costInUSD).toFixed(4)}
                                {record.breakdown && (
                                  <HelpCircle className="h-3 w-3 text-slate-400" />
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {renderBreakdown(record)}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TooltipProvider>
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
  );
};

export default UsagePage;
