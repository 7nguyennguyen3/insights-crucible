"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import {
  backgroundVariants,
  textGradients,
  containerVariants,
  spacingVariants,
  typographyVariants,
} from "@/styles/variants";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const PRICING_TIERS = [
  {
    name: "Starter",
    price: 5,
    credits: 30,
    bonusCredits: 0,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PACK_PRICE_ID,
    description: "Perfect for getting started",
    highlighted: false,
  },
  {
    name: "Professional",
    price: 10,
    credits: 60,
    bonusCredits: 15,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PACK_PRICE_ID,
    description: "Best value with bonus credits",
    highlighted: true,
  },
  {
    name: "Ultimate",
    price: 20,
    credits: 120,
    bonusCredits: 50,
    priceId: process.env.NEXT_PUBLIC_STRIPE_ULTIMATE_PACK_PRICE_ID,
    description: "Maximum value with extra bonus",
    highlighted: false,
  },
];

const PricingCard: React.FC<{
  name: string;
  price: number;
  credits: number;
  bonusCredits: number;
  description: string;
  highlighted: boolean;
  priceId: string | undefined;
}> = ({
  name,
  price,
  credits,
  bonusCredits,
  description,
  highlighted,
  priceId,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    if (!priceId) {
      toast.error("Pricing configuration error. Please try again later.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          quantity: 1,
          success_url: `${window.location.origin}/account?payment_success=true`,
          cancel_url: window.location.href,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe not available");
      }

      const result = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start checkout"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`group relative ${highlighted ? "scale-105" : ""}`}>
      {highlighted && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg z-10 whitespace-nowrap">
          🔥 Most Popular
        </div>
      )}

      {/* Subtle backdrop */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${highlighted ? "from-stone-100/60 to-stone-200/60" : "from-stone-50/40 to-stone-100/40"} dark:${highlighted ? "from-stone-700/40 to-stone-800/40" : "from-stone-800/20 to-stone-900/20"} rounded-3xl transition-all duration-300`}
      />

      <div
        className={`relative bg-white/60 dark:bg-slate-800/60 p-8 rounded-3xl border ${highlighted ? "border-stone-300/50 shadow-lg" : "border-stone-200/30 dark:border-stone-700/30"} transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-2 group-hover:bg-white/70 dark:group-hover:bg-slate-800/70 h-full flex flex-col`}
      >
        <div className="text-center mb-8 flex-grow">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            {name}
          </h3>
          <p className="text-slate-800 dark:text-slate-200 text-sm mb-6">
            {description}
          </p>

          <div className="mb-6">
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-5xl font-extrabold text-slate-900 dark:text-slate-100">
                ${price}
              </span>
            </div>

            <div className={`text-lg font-bold ${textGradients.accent} mb-2`}>
              {credits + bonusCredits} Credits
              {bonusCredits > 0 && (
                <span className="inline-flex items-center ml-3 px-3 py-1 bg-stone-200/60 dark:bg-stone-700/60 rounded-full text-xs font-semibold text-slate-800 dark:text-slate-200">
                  +{bonusCredits} bonus
                </span>
              )}
            </div>

            <div className="text-sm text-slate-700 dark:text-slate-300">
              ${(price / (credits + bonusCredits)).toFixed(2)} per analysis
            </div>

            <div className="mt-3 text-xs font-medium min-h-[1rem]">
              {bonusCredits > 0 ? (
                <span className="text-slate-700 dark:text-slate-300">
                  💡 Save{" "}
                  {Math.round((bonusCredits / (credits + bonusCredits)) * 100)}%
                  with bonus credits
                </span>
              ) : (
                <span className="text-transparent">
                  💡 Placeholder text for height consistency
                </span>
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={handlePurchase}
          disabled={isLoading || !priceId}
          className={`w-full shadow-lg transition-all duration-300 px-8 py-4 h-auto text-base font-semibold rounded-full ${
            highlighted
              ? "bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:via-blue-500 hover:to-cyan-500 text-white shadow-teal-500/30 hover:shadow-teal-500/50 transform hover:scale-105 border border-teal-600/20"
              : "bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isLoading ? "Loading..." : `Choose ${name}`}
        </Button>
      </div>
    </div>
  );
};

export const PricingSection: React.FC = () => (
  <section
    id="pricing"
    className={`relative ${spacingVariants.sectionPadding} ${backgroundVariants.universal} overflow-hidden`}
  >
    {/* Subtle background elements */}
    <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-br from-stone-200/10 to-stone-300/10 dark:from-stone-700/10 dark:to-stone-800/10 rounded-full blur-3xl" />
    <div className="absolute bottom-20 left-20 w-32 h-32 bg-gradient-to-br from-stone-100/8 to-stone-200/8 dark:from-stone-800/8 dark:to-stone-900/8 rounded-full blur-2xl" />

    <div className={`${containerVariants.section} relative`}>
      <div className={containerVariants.maxWidth}>
        <div className="max-w-4xl mb-20 mx-auto text-center">
          <h2
            className={`${typographyVariants.sectionTitle} text-slate-900 dark:text-slate-100 mb-6`}
          >
            Simple Credit-Based
            <span className={`block ${textGradients.accent}`}>Pricing</span>
          </h2>

          <p className="text-xl text-slate-800 dark:text-slate-200 leading-relaxed max-w-3xl mx-auto">
            Pay only for what you use. No subscriptions, no monthly fees. Buy
            credits and use them whenever you need AI-powered podcast analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRICING_TIERS.map((tier, index) => (
            <PricingCard
              key={tier.name}
              name={tier.name}
              price={tier.price}
              credits={tier.credits}
              bonusCredits={tier.bonusCredits}
              description={tier.description}
              highlighted={tier.highlighted}
              priceId={tier.priceId}
            />
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-slate-700 dark:text-slate-300 max-w-2xl mx-auto text-lg">
            ✨ All plans include the same features. Credits never expire.
          </p>
        </div>
      </div>
    </div>
  </section>
);
