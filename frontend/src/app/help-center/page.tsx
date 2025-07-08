"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Search, ArrowRight } from "lucide-react";
import Link from "next/link";

// You can easily manage all your FAQs here
const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "What is Insight Engine?",
        a: "Insight Engine is a powerful tool that transforms raw content like audio, video, or text into structured summaries, key concepts, and ready-to-publish content like social media threads and blog posts.",
      },
      {
        q: "How do I process my first file?",
        a: "Navigate to the 'Insight Engine' page. You can either paste a transcript directly into the text area or use the 'Upload File' tab to select an audio or video file from your computer. Then, select the analyses you want to run and click 'Process'.",
      },
      {
        q: "What file formats are supported?",
        a: "We currently support MP3, MP4, M4A, and WAV for file uploads. You can also process any text by pasting it directly.",
      },
    ],
  },
  {
    category: "Billing & Subscription",
    questions: [
      {
        q: "How does the credit system work?",
        a: "Every analysis has an estimated cost based on its complexity and length. These costs are deducted from your monthly credits. Your free plan includes $1 of credits every month, and you can upgrade to a Pro plan for more credits and discounts.",
      },
      {
        q: "How can I upgrade my plan?",
        a: "You can view and change your subscription plan from the 'Pricing' page. If you are on a paid plan, you can manage your billing details from the 'Settings' page.",
      },
      {
        q: "Do my credits roll over to the next month?",
        a: "No, your monthly credits reset at the beginning of each billing cycle. They do not roll over.",
      },
    ],
  },
  {
    category: "Account Management",
    questions: [
      {
        q: "How do I change my password?",
        a: "You can change your password on the 'Settings' page. You will be required to enter your current password for security purposes.",
      },
      {
        q: "How do I delete my account?",
        a: "You can delete your account from the 'Danger Zone' section at the bottom of the 'Settings' page. Please be aware that this action is permanent and cannot be undone.",
      },
    ],
  },
];

const HelpCenterPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFaqs = useMemo(() => {
    if (!searchTerm) return faqData;

    const lowercasedFilter = searchTerm.toLowerCase();

    return faqData
      .map((category) => {
        const filteredQuestions = category.questions.filter(
          (item) =>
            item.q.toLowerCase().includes(lowercasedFilter) ||
            item.a.toLowerCase().includes(lowercasedFilter)
        );
        return { ...category, questions: filteredQuestions };
      })
      .filter((category) => category.questions.length > 0);
  }, [searchTerm]);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 py-20 md:py-24">
        {/* Header & Search Section */}
        <header className="text-center mb-12">
          <LifeBuoy className="mx-auto h-16 w-16 text-blue-500 mb-4" />
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            How can we help?
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Find answers to common questions about your account, billing, and
            our features.
          </p>
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="search"
                placeholder="Search for answers..."
                className="w-full pl-12 pr-4 py-3 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* FAQ Section */}
        <main className="max-w-4xl mx-auto">
          {filteredFaqs.length > 0 ? (
            <div className="space-y-8">
              {filteredFaqs.map((category) => (
                <section key={category.category}>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                    {category.category}
                  </h2>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item) => (
                      <AccordionItem value={item.q} key={item.q}>
                        <AccordionTrigger className="text-left text-lg hover:no-underline">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-base text-slate-600 dark:text-slate-400">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold">No results found</h3>
              <p className="text-slate-500 mt-2">
                We couldn't find any answers matching your search. Try different
                keywords or check out the categories.
              </p>
            </div>
          )}
        </main>

        {/* "Still need help?" CTA Section */}
        <aside className="mt-20">
          <Card className="max-w-2xl mx-auto text-center shadow-xl dark:bg-slate-900/70">
            <CardHeader>
              <CardTitle className="text-2xl">Can't find an answer?</CardTitle>
              <CardDescription>
                Our team is here to help you with any questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={"/contact-us"}>
                  Contact Support <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default HelpCenterPage;
