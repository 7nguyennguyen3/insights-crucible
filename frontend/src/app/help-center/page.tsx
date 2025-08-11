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

const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "What is Insights Crucible?",
        a: "Insights Crucible is a platform that analyzes your text or audio content to extract structured summaries, key concepts, and generate ready-to-publish material like social media threads and blog posts.",
      },
      {
        q: "How do I run my first analysis?",
        // ✅ UPDATED: More precise description of the process.
        a: "Navigate to the launch engine. You can either paste a transcript or upload a supported audio file (MP3, M4A, WAV). After you provide the content, click 'Check Cost' to see the analysis cost. If you have enough allowance, you can then confirm to begin processing.",
      },
      {
        q: "What file formats do you support?",
        a: "We currently support MP3, MP4, M4A, and WAV for audio uploads. You can also process any text by pasting it directly.",
      },
    ],
  },
  {
    category: "Billing and Plans",
    questions: [
      {
        q: "How does the analysis allowance work?",
        // ✅ UPDATED: Replaced 'credits' with 'analyses'.
        a: "Each analysis you run costs a minimum of 0.5 to 1 base on size. The Free plan includes 5 analysis credits per month. Paid plans (Starter/Pro) come with more credits per month and receive additional 5 free analysis credits each month.",
      },
      {
        q: "Do my unused analysis credits roll over?",
        // ✅ UPDATED: Clearer policy for free vs. paid.
        a: "For paid plans, yes! Unused analysis credits roll over to the next month. For the Free plan, the allowance resets to 5 new analysis credits at the beginning of each calendar month and does not roll over.",
      },
      {
        q: "How do I upgrade or manage my plan?",
        a: "You can upgrade from a Free to a paid plan on our 'Pricing' page. If you are already on a paid plan, all management tasks, including cancellation and billing details, are handled on your 'Account' page.",
      },
    ],
  },
  {
    category: "Account Management",
    questions: [
      {
        q: "How do I change my password?",
        a: "You can change your password on the 'Settings' page, accessible from your Account dashboard. You will be required to enter your current password for security.",
      },
      {
        q: "How do I delete my account?",
        a: "You can permanently delete your account from the 'Danger Zone' section at the bottom of the 'Settings' page. Please be aware that this action is irreversible.",
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
