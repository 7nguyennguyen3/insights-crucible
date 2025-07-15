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
import { Award, Check, Loader2, X } from "lucide-react";
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
  // ✅ CHANGED: Billing cycle is now fixed to monthly.
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
        monthly: process.env.NEXT_PUBLIC_STRIPE_CHARTER_MEMBER_PLAN_PRICE_ID!,
        annually: null,
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
      setIsContactDialogOpen(false); // Close dialog on success
      // Reset form
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
        action: () => router.push("/account"),
        disabled: isCheckoutLoading === "manage",
      };
    }

    if (tier.planId === "charter") {
      const priceId = tier.price_id[billingCycle];
      if (!priceId) {
        // Handles the case where the annual plan is disabled
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

    return { text: tier.name, action: () => {}, disabled: true };
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen w-full py-12 sm:py-16 lg:py-20">
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Sales</DialogTitle>
            <DialogDescription>
              Have questions about our Enterprise plan? Fill out the form below
              and we'll be in touch.
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

        {/* ✅ CHANGED: Commented out the billing cycle toggle for now
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
        */}

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
                    {tier.planId !== "free" && tier.planId !== "enterprise" && (
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
                What counts as one "analysis"?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Each file you upload and process—whether audio or text—counts as
                a single analysis against your balance, regardless of its
                length.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                Do my monthly analyses roll over? 🤔
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                <b>Yes, for paid plans.</b> Unused analyses on the Pro or
                Charter plans roll over to the next month, up to a maximum
                accumulated balance of 100 analyses.
                <br />
                <br />
                Analyses for the Free plan do not roll over. Your balance is
                reset to 3 new analyses at the start of each month.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                When do I get my new analyses? 🗓️
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                <b>Pro & Charter Plans:</b> Your analysis allowance resets on
                your personal billing date (e.g., if you subscribe on July 15th,
                your next allowance arrives on August 15th).
                <br />
                <br />
                <b>Free Plan:</b> You receive 3 new analyses on the 1st day of
                every calendar month, based on Pacific Time (PT).
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Can I cancel my plan?</h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Of course. You can cancel your subscription at any time from
                your account dashboard. You'll retain access to all paid
                features until the end of your current billing period.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PricingPage;
