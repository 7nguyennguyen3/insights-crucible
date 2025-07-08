// pages/pricing.tsx

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useUserProfile } from "@/hooks/useUserProfile";
import { loadStripe } from "@stripe/stripe-js";
import apiClient from "@/lib/apiClient";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, X, Loader2, Star, Award } from "lucide-react";

// Initialize Stripe.js with your publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const PricingPage = () => {
  const { user } = useAuthStore();
  const { profile } = useUserProfile();
  const router = useRouter();

  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(
    null
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">(
    "monthly"
  );

  // --- CHANGE: Updated feature lists for the new analysis-based model ---
  const tiers = [
    {
      name: "Free",
      planId: "free",
      price: { monthly: "$0", annually: "$0" },
      price_id: { monthly: null, annually: null },
      description: "Get a feel for our core features, on us.",
      features: [
        {
          text: "5 free analyses",
          value: "A one-time grant to get you started.",
          locked: false,
        },
        { text: "Generate X/Twitter Content", locked: false },
        { text: "Generate Blog Post", locked: true },
        { text: "5-Angle Perspective Analysis", locked: true },
      ],
      isPopular: false,
    },
    {
      name: "Charter Member",
      planId: "charter",
      price: { monthly: "$15", annually: "$150" },
      price_id: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_CHARTER_PLAN_PRICE_ID!,
        annually: process.env.NEXT_PUBLIC_STRIPE_CHARTER_ANNUAL_PLAN_PRICE_ID!,
      },
      description: "Limited-time lifetime pricing for our first 100 users.",
      features: [
        {
          text: "25 analyses per month",
          value: "Your allowance resets on your billing date.",
          locked: false,
        },
        {
          text: "All future Professional Plan features",
          value: "Locked in at this price forever.",
          locked: false,
        },
        { text: "Generate Blog Post", locked: false },
        { text: "5-Angle Perspective Analysis", locked: false },
        { text: "A genuine voice in our product roadmap", locked: false },
      ],
      isPopular: true,
    },
    {
      name: "Enterprise",
      planId: "enterprise",
      price: { monthly: "Custom", annually: "Custom" },
      price_id: { monthly: null, annually: null },
      description: "For businesses and teams with custom needs.",
      features: [
        { text: "Custom analysis limits & volume discounts", locked: false },
        { text: "Dedicated support & onboarding", locked: false },
        { text: "Advanced security & compliance", locked: false },
        { text: "Custom feature development", locked: false },
      ],
      isPopular: false,
    },
  ];

  // The handleCreateCheckout and handleManageSubscription functions remain unchanged
  const handleCreateCheckout = async (priceId: string) => {
    if (!user) return router.push("/auth/signin");
    setIsCheckoutLoading(priceId);
    try {
      const success_url = `${window.location.origin}/dashboard?payment_success=true`;
      const cancel_url = window.location.href;
      const { data } = await apiClient.post(
        "/billing/create-checkout-session",
        { priceId, success_url, cancel_url }
      );
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe.js not loaded");
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (err) {
      console.error("Failed to create checkout session:", err);
    } finally {
      setIsCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return router.push("/auth/signin");
    setIsCheckoutLoading("manage_subscription");
    try {
      const { data } = await apiClient.post("/billing/create-portal-session");
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Could not retrieve billing portal URL.");
      }
    } catch (err) {
      console.error("Failed to create portal session:", err);
    } finally {
      setIsCheckoutLoading(null);
    }
  };

  // The getButtonState logic remains unchanged
  const getButtonState = (tier: (typeof tiers)[0]) => {
    if (!user) {
      return {
        text: "Get Started",
        action: () => router.push("/signup"),
        disabled: false,
      };
    }

    const currentPlan = profile?.plan || "free";

    if (currentPlan === tier.planId) {
      if (tier.planId === "free") {
        return { text: "Your Current Plan", action: () => {}, disabled: true };
      }
      return {
        text: "Manage Subscription",
        action: handleManageSubscription,
        disabled: isCheckoutLoading === "manage_subscription",
      };
    }

    if (tier.planId === "charter") {
      const priceId = tier.price_id[billingCycle];
      return {
        text: "Become a Charter Member",
        action: () => handleCreateCheckout(priceId!),
        disabled: isCheckoutLoading !== null || currentPlan === "charter",
      };
    }

    if (tier.planId === "enterprise") {
      return {
        text: "Contact Sales",
        action: () => router.push("mailto:sales@yourdomain.com"), // Remember to change this email
        disabled: false,
      };
    }

    return { text: tier.name, action: () => {}, disabled: true };
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen w-full py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Join as a Charter Member
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Secure lifetime pricing and help shape the future of our platform.
            This offer is only available for our first 100 users.
          </p>
        </header>

        {/* Billing Cycle Toggle remains unchanged */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <Label htmlFor="billing-cycle" className="font-medium">
            Monthly
          </Label>
          <Switch
            id="billing-cycle"
            checked={billingCycle === "annually"}
            onCheckedChange={(checked) =>
              setBillingCycle(checked ? "annually" : "monthly")
            }
          />
          <Label htmlFor="billing-cycle" className="font-medium">
            Annually
          </Label>
          <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
            Save 16%
          </span>
        </div>

        {/* The Tier Card mapping logic remains the same, it will use the new `tiers` data automatically */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => {
            const buttonState = getButtonState(tier);
            const price = tier.price[billingCycle];

            return (
              <Card
                key={tier.planId}
                className={`flex flex-col rounded-2xl shadow-lg mx-auto sm:min-w-[300px] ${
                  tier.isPopular ? "border-2 border-blue-500 relative" : ""
                }`}
              >
                {tier.isPopular && (
                  <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                    <div className="bg-blue-500 text-white text-xs font-semibold px-4 py-1 rounded-full flex items-center gap-1">
                      <Award className="w-4 h-4 fill-white" />
                      Charter Offer
                    </div>
                  </div>
                )}
                <CardHeader className="pt-10">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-5xl font-bold tracking-tight">
                      {price}
                    </span>
                    {tier.planId !== "free" && tier.planId !== "enterprise" && (
                      <span className="text-slate-500 dark:text-slate-400">
                        {billingCycle === "monthly" ? "/month" : "/year"}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-4">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        {feature.locked ? (
                          <X className="w-5 h-5 text-red-400 mr-2 shrink-0 mt-1" />
                        ) : (
                          <Check className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-1" />
                        )}
                        <div className="flex flex-col">
                          <span
                            className={
                              feature.locked
                                ? "text-muted-foreground line-through"
                                : ""
                            }
                          >
                            {feature.text}
                          </span>
                          {feature.value && (
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {feature.value}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={`w-full ${
                      tier.isPopular && !buttonState.disabled
                        ? "bg-blue-600 hover:bg-blue-700"
                        : ""
                    }`}
                    variant={buttonState.disabled ? "outline" : "default"}
                    onClick={buttonState.action}
                    disabled={buttonState.disabled}
                  >
                    {isCheckoutLoading &&
                    (isCheckoutLoading === tier.price_id[billingCycle] ||
                      (buttonState.text === "Manage Subscription" &&
                        isCheckoutLoading === "manage_subscription")) ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      buttonState.text
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* --- CHANGE: Updated FAQ section for the new model --- */}
        <section className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg">
                What counts as one "analysis"?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Each file you upload and process, whether it's an audio file or
                a text document, counts as a single analysis against your
                monthly allowance, regardless of its length.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                What happens if I use all my monthly analyses on the Charter
                plan?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Your allowance of 25 analyses will reset at the beginning of
                your next billing cycle. We are currently exploring options for
                purchasing additional analysis packs for power users.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                Do my monthly analyses roll over?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                No, unused analyses do not roll over to the next month. Your 25
                analyses are replenished on each billing cycle renewal. The 5
                analyses on the Free plan are a one-time grant and do not
                refresh.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                Can I cancel my Charter plan?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Yes, you can cancel your subscription at any time from your
                account dashboard. You will retain access to Charter features
                until the end of your current billing period.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PricingPage;
