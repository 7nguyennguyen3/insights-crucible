// src/app/pricing/page.tsx
"use client";

import { useUserProfile } from "@/hooks/useUserProfile";
import apiClient from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Award, Check, HelpCircle, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@radix-ui/react-label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactMessage, setContactMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const tiers = [
    {
      name: "Free",
      planId: "free",
      price: { monthly: "$0", annually: "$0" },
      price_id: { monthly: null, annually: null },
      description: "For trying out the core features of our platform.",
      features: [
        {
          text: "5 analysis credits per month",
          value: "Credits reset on the 1st of each month (PT).",
          locked: false,
        },
        { text: "Generate X/Twitter Threads", locked: false },
        { text: "Generate Blog Posts", locked: false },
        {
          text: "Standard Analysis Power",
          tooltip: "1 credit = 60 mins audio or 100k characters.",
          locked: false,
        },
        { text: "5-Angle Perspective Analysis", locked: true },
      ],
      isPopular: false,
    },
    {
      name: "Charter Member",
      planId: "charter",
      price: { monthly: "$15", annually: "$150" },
      price_id: {
        monthly: process.env.NEXT_PUBLIC_STRIPE_CHARTER_MEMBER_PLAN_PRICE_ID!,
        annually: null, // Annual plan not yet available for charter
      },
      description: "Limited-time lifetime pricing for our first 100 users.",
      features: [
        {
          text: "25 new analysis credits each month",
          value: "Added to your balance on your billing date.",
          locked: false,
        },
        {
          text: "Unused analysis credit roll over",
          value: "Credits never expire with an active plan.",
          locked: false,
        },
        {
          text: "Enhanced Analysis Power",
          tooltip: "1 credit = 90 mins audio or 125k characters.",
          locked: false,
        },
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
        {
          text: "Custom analysis credit limits & volume discounts",
          locked: false,
        },
        { text: "Dedicated support & onboarding", locked: false },
        { text: "Advanced security & compliance", locked: false },
        { text: "Custom feature development", locked: false },
      ],
      isPopular: false,
    },
  ];

  const handleCreateCheckout = async ({
    priceId,
    quantity = 1,
  }: {
    priceId: string;
    quantity?: number;
  }) => {
    if (!user) {
      router.push("/auth/signin");
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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) {
      toast.error("Please fill out all fields.");
      return;
    }
    setIsSending(true);
    try {
      await apiClient.post("/support/contact", {
        name: contactName,
        email: contactEmail,
        message: contactMessage,
      });
      toast.success("Message Sent!", {
        description: "Thanks for reaching out. We'll get back to you shortly.",
      });
      setIsContactDialogOpen(false);
      setContactName("");
      setContactEmail(user?.email || "");
      setContactMessage("");
    } catch (error) {
      toast.error("Failed to send message.", {
        description: "Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getButtonState = (tier: (typeof tiers)[0]) => {
    // Handle users who are NOT signed in
    if (!user) {
      if (tier.planId === "enterprise") {
        return {
          text: "Contact Sales",
          action: () => setIsContactDialogOpen(true),
          disabled: false,
        };
      }
      return {
        text: "Get Started",
        action: () => router.push("/auth?tab=signup"),
        disabled: false,
      };
    }

    // Handle users who ARE signed in
    const currentPlan = profile?.plan || "free";

    if (currentPlan === tier.planId) {
      if (tier.planId === "free") {
        return { text: "Your Current Plan", action: () => {}, disabled: true };
      }
      return {
        text: "Manage Subscription",
        action: () => router.push("/account"),
        disabled: false,
      };
    }

    if (tier.planId === "charter") {
      const priceId = tier.price_id[billingCycle];
      if (!priceId) {
        return { text: "Not Available", action: () => {}, disabled: true };
      }
      return {
        text: "Become a Charter Member",
        action: () => handleCreateCheckout({ priceId: priceId! }),
        disabled: isCheckoutLoading !== null || currentPlan === "charter",
      };
    }

    if (tier.planId === "enterprise") {
      return {
        text: "Contact Sales",
        action: () => setIsContactDialogOpen(true),
        disabled: false,
      };
    }

    // Fallback for upgrading from free to a non-charter/enterprise plan
    if (tier.planId !== "free" && currentPlan === "free") {
      const priceId = tier.price_id[billingCycle];
      if (!priceId)
        return { text: "Not Available", action: () => {}, disabled: true };
      return {
        text: `Upgrade to ${tier.name}`,
        action: () => handleCreateCheckout({ priceId }),
        disabled: isCheckoutLoading !== null,
      };
    }

    return { text: tier.name, action: () => {}, disabled: true };
  };

  return (
    <TooltipProvider>
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen w-full py-12 sm:py-16 lg:py-20">
        <Dialog
          open={isContactDialogOpen}
          onOpenChange={setIsContactDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contact Sales</DialogTitle>
              <DialogDescription>
                Have questions about our Enterprise plan? Fill out the form
                below and we'll be in touch.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleContactSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="message" className="text-right">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSending}>
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mt-12">
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
                      {tier.planId !== "free" &&
                        tier.planId !== "enterprise" && (
                          <span className="text-slate-500 dark:text-slate-400">
                            /month
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
                              className={`flex items-center ${
                                feature.locked
                                  ? "text-muted-foreground line-through"
                                  : ""
                              }`}
                            >
                              {feature.text}
                              {feature.tooltip && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="w-4 h-4 ml-1.5 text-slate-400 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{feature.tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
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
                          isCheckoutLoading === "manage")) ? (
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
          <section className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg">
                  What is an "analysis credit" and how are credits used?
                </h3>
                {/* FIX: Replaced <p> with <div> to prevent hydration errors */}
                <div className="text-slate-600 dark:text-slate-400 mt-2">
                  Each file you upload for processing consumes at least one
                  analysis credit. However, the amount of data one credit can
                  process—what we call <b>Analysis Power</b>—is much higher on
                  paid plans.
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>
                      <b>Paid Plan:</b> 1 credit can process up to{" "}
                      <b>75 minutes</b> of audio or <b>125,000</b> text
                      characters.
                    </li>
                    <li>
                      <b>Free Plan:</b> 1 credit can process up to{" "}
                      <b>45 minutes</b> of audio or <b>100,000</b> text
                      characters.
                    </li>
                  </ul>
                  <p className="mt-2">
                    This means your credits go much further with a Charter or
                    Pro subscription, allowing you to analyze larger files for
                    the same credit cost.
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  Do my monthly analysis credit roll over? 🤔
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  <b>Yes, for all paid plans.</b> Unused analysis credit from
                  your monthly allowance automatically roll over and are added
                  to your balance. They never expire as long as your
                  subscription remains active.
                  <br />
                  <br />
                  analysis credit for the <b>Free plan do not roll over.</b> You
                  receive a fresh grant of 5 analysis credits on the first day
                  of each calendar month.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  When do I get my new analysis credit? 🗓️
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  <b>Charter & Pro Plans:</b> Your analysis credit allowance is
                  added to your account on your personal billing date (e.g., if
                  you subscribe on July 15th, your next credits arrive on August
                  15th).
                  <br />
                  <br />
                  <b>Free Plan:</b> You receive 5 new analysis credit on the 1st
                  day of every calendar month, based on Pacific Time (PT).
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Can I cancel my plan?</h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Of course. You can cancel your subscription at any time from
                  your account dashboard. You'll retain access to all paid
                  features and your rolled-over credits until the end of your
                  current billing period.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PricingPage;
