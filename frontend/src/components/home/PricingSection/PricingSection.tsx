"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { Shield, CheckCircle, ArrowRight, Lock, CreditCard } from "lucide-react";

const PRICING_TIERS = [
  {
    name: "Starter",
    price: 5,
    credits: 30,
    bonusCredits: 0,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PACK_PRICE_ID,
    description: "Perfect for getting started",
    highlighted: false,
    features: [
      "30 analysis credits",
      "All platform features included",
      "Access to all analysis types",
      "Export to PDF/DOCX/Markdown"
    ]
  },
  {
    name: "Professional",
    price: 10,
    credits: 60,
    bonusCredits: 15,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PACK_PRICE_ID,
    description: "Best value with bonus credits",
    highlighted: true,
    features: [
      "75 analysis credits (60 + 15 bonus)",
      "All platform features included",
      "Access to all analysis types",
      "Export to PDF/DOCX/Markdown",
      "Best value per credit"
    ]
  },
  {
    name: "Ultimate",
    price: 20,
    credits: 120,
    bonusCredits: 50,
    priceId: process.env.NEXT_PUBLIC_STRIPE_ULTIMATE_PACK_PRICE_ID,
    description: "Maximum value for power users",
    highlighted: false,
    features: [
      "170 analysis credits (120 + 50 bonus)",
      "All platform features included",
      "Access to all analysis types",
      "Export to PDF/DOCX/Markdown",
      "Maximum savings per credit"
    ]
  },
];

const PricingCard: React.FC<{
  name: string;
  price: number;
  credits: number;
  bonusCredits: number;
  description: string;
  highlighted: boolean;
  features: string[];
  priceId: string | undefined;
}> = ({
  name,
  price,
  credits,
  bonusCredits,
  description,
  highlighted,
  features,
  priceId,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className={`group relative ${highlighted ? "scale-105" : ""}`}>
      {highlighted && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg z-10">
          🏆 Most Popular
        </div>
      )}

      <div
        className={`relative bg-white dark:bg-slate-800 p-8 rounded-2xl border ${
          highlighted
            ? "border-blue-200 shadow-xl shadow-blue-500/10"
            : "border-slate-200 dark:border-slate-700 shadow-sm"
        } transition-all duration-300 group-hover:shadow-lg h-full flex flex-col`}
      >
        <div className="text-center mb-8 flex-grow">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            {name}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
            {description}
          </p>

          <div className="mb-6">
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-5xl font-bold text-slate-900 dark:text-slate-100">
                ${price}
              </span>
            </div>

            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
              {credits + bonusCredits} Credits
              {bonusCredits > 0 && (
                <span className="inline-flex items-center ml-3 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                  +{bonusCredits} bonus
                </span>
              )}
            </div>

            <div className="text-sm text-slate-600 dark:text-slate-400">
              ${(price / (credits + bonusCredits)).toFixed(2)} per analysis
            </div>

            {bonusCredits > 0 && (
              <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                💰 Save {Math.round((bonusCredits / (credits + bonusCredits)) * 100)}% with bonus credits
              </div>
            )}
          </div>

          {/* Features list */}
          <div className="text-left mb-8">
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={() => {/* Handle purchase */}}
          disabled={isLoading || !priceId}
          className={`w-full shadow-lg transition-all duration-300 px-8 py-4 h-auto text-base font-semibold rounded-xl ${
            highlighted
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:scale-105"
              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isLoading ? "Loading..." : `Buy ${name} Pack`}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export const PricingSection: React.FC = () => (
  <section
    id="pricing"
    className="relative py-20 bg-slate-50 dark:bg-slate-900 overflow-hidden"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6">
          Simple, Transparent Pricing
        </h2>

        <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl mx-auto">
          Start with 30 free credits when you sign up. All users get access to the same powerful features - just buy more credits when you need them. No subscriptions, no monthly fees.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
        {PRICING_TIERS.map((tier, index) => (
          <PricingCard
            key={tier.name}
            name={tier.name}
            price={tier.price}
            credits={tier.credits}
            bonusCredits={tier.bonusCredits}
            description={tier.description}
            highlighted={tier.highlighted}
            features={tier.features}
            priceId={tier.priceId}
          />
        ))}
      </div>

      {/* Trust indicators */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center">
            <Shield className="w-8 h-8 text-green-600 mb-2" />
            <div className="font-semibold text-slate-900 dark:text-slate-100">30-Day Guarantee</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Full refund if not satisfied</div>
          </div>
          <div className="flex flex-col items-center">
            <Lock className="w-8 h-8 text-blue-600 mb-2" />
            <div className="font-semibold text-slate-900 dark:text-slate-100">Secure Payments</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">256-bit SSL encryption</div>
          </div>
          <div className="flex flex-col items-center">
            <CreditCard className="w-8 h-8 text-purple-600 mb-2" />
            <div className="font-semibold text-slate-900 dark:text-slate-100">Never Expire</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Credits never expire</div>
          </div>
          <div className="flex flex-col items-center">
            <CheckCircle className="w-8 h-8 text-teal-600 mb-2" />
            <div className="font-semibold text-slate-900 dark:text-slate-100">Pay Per Use</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">No subscriptions required</div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            ✨ All plans include the same powerful features. Choose based on your usage needs.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-slate-500 dark:text-slate-500">
            <span>🔒 SOC 2 Compliant</span>
            <span>💳 Stripe Secured</span>
            <span>⚡ Instant Activation</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);