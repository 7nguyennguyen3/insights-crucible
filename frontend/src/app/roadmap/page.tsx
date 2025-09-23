// /app/roadmap/page.tsx

"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle,
  Layers,
  FileText,
  Lightbulb,
  MessageSquareQuote,
  Zap,
  Users,
  Share2,
  Loader2,
  Play,
  Upload,
  BookOpen,
  Download,
  Globe,
  BarChart3,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// A specialized card for roadmap items
const RoadmapCard = ({
  icon: Icon,
  title,
  description,
  status,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  status: "Now" | "Next" | "Later";
}) => {
  const statusStyles = {
    Now: {
      badge:
        "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
      icon: "text-green-600 dark:text-green-400",
    },
    Next: {
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
      icon: "text-blue-600 dark:text-blue-400",
    },
    Later: {
      badge:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
      icon: "text-purple-600 dark:text-purple-400",
    },
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg`}
        >
          <Icon className={`w-6 h-6 ${statusStyles[status].icon}`} />
        </div>
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${statusStyles[status].badge}`}
        >
          {status}
        </span>
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 flex-grow">
        {description}
      </p>
    </div>
  );
};

const RoadmapPage = () => {
  const { user } = useAuthStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [priority, setPriority] = useState("Important");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/feature-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Use the email from your auth store
        body: JSON.stringify({ title, description, email: user?.email }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback.");
      }

      toast.success("Feedback submitted!", {
        description: "Thanks for helping us improve.",
      });
      setTitle("");
      setDescription("");
      setOpen(false); // Close the dialog on success
    } catch (error) {
      toast.error("Submission failed.", {
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {/* --- HERO SECTION --- */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 max-w-4xl mx-auto">
            The Future of Learning
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Transform any content into structured learning experiences with AI-powered analysis,
            interactive quizzes, and professional exports. See what you can do today and what's coming next.
          </p>
        </div>
      </section>

      {/* --- ROADMAP --- */}
      <section className="pb-20 md:pb-32">
        <div className="container mx-auto px-4">
          {/* === NOW: THE FOUNDATION === */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-100 mb-8">
              What You Can Do Today
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <RoadmapCard
                icon={Play}
                title="Multi-Format Content Analysis"
                description="Process YouTube videos, audio files, and text content with AI-powered deep dive analysis that extracts key insights, themes, and actionable takeaways."
                status="Now"
              />
              <RoadmapCard
                icon={BookOpen}
                title="Interactive Learning System"
                description="Transform content into structured learning with AI-generated quizzes, multiple choice questions, and open-ended assessments for active learning."
                status="Now"
              />
              <RoadmapCard
                icon={Download}
                title="Professional Export Options"
                description="Export your analyses to polished PDF reports, Word documents, or Markdown files for sharing and professional presentation."
                status="Now"
              />
              <RoadmapCard
                icon={Globe}
                title="Public Sharing & Library"
                description="Share analyses publicly with generated links and contribute to the community library where others can discover your insights."
                status="Now"
              />
              <RoadmapCard
                icon={Upload}
                title="Bulk Processing System"
                description="Upload multiple files at once for batch processing, perfect for analyzing entire podcast series or document collections."
                status="Now"
              />
              <RoadmapCard
                icon={Layers}
                title="Analysis Management"
                description="Organize analyses with folders, search functionality, and dashboard overview for managing your growing library of insights."
                status="Now"
              />
            </div>
          </div>

          {/* === NEXT: IN ACTIVE DEVELOPMENT === */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-100 mb-8">
              What's Coming Next
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <RoadmapCard
                icon={BrainCircuit}
                title="Cross-File Analysis"
                description="Analyze multiple files together to discover overlapping themes, contradictions, and patterns across your entire content collection."
                status="Next"
              />
              <RoadmapCard
                icon={BarChart3}
                title="Enhanced Learning Analytics"
                description="Track learning progress, quiz performance, and knowledge retention with detailed analytics and personalized learning recommendations."
                status="Next"
              />
              <RoadmapCard
                icon={Users}
                title="Team Collaboration"
                description="Share workspaces with team members, collaborate on analyses, and create shared knowledge bases for organizations."
                status="Next"
              />
              <RoadmapCard
                icon={MessageSquareQuote}
                title="Advanced Quote Management"
                description="Enhanced quote extraction, source tracking, and the ability to jump directly from insights to their original timestamps in content."
                status="Next"
              />
            </div>
          </div>

          {/* === LATER: EXPLORING FOR THE FUTURE === */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-100 mb-8">
              Future Ambitions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <RoadmapCard
                icon={Settings}
                title="Custom Analysis Types"
                description="Define your own analysis prompts and templates beyond the current deep dive format. Create specialized analysis workflows for different use cases."
                status="Later"
              />
              <RoadmapCard
                icon={Share2}
                title="Integration Ecosystem"
                description="Connect with Google Drive, Dropbox, Notion, Slack, and other tools for seamless content import and insight distribution across your workflow."
                status="Later"
              />
              <RoadmapCard
                icon={Lightbulb}
                title="AI Learning Companion"
                description="Advanced AI that learns your interests and analysis patterns to suggest content, provide personalized insights, and guide your learning journey."
                status="Later"
              />
              <RoadmapCard
                icon={CheckCircle}
                title="Enterprise Solutions"
                description="Advanced security, compliance features, custom deployment options, and dedicated support for organizations processing sensitive content."
                status="Later"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="pb-20 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-white dark:bg-slate-800/50 p-10 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Have an Idea?
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Our roadmap is driven by feedback from users like you. If there's
              a feature you'd love to see, we want to hear about it.
            </p>
            <div className="mt-8">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="lg">
                    Request a Feature
                    <ArrowRight />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Request a Feature</DialogTitle>
                    <DialogDescription>
                      Have a great idea? We'd love to hear it. The best ideas
                      come from our users.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="title">Feature Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Cross-File Thematic Analysis"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>

                    {/* REFRAMED a "Description" to "The Problem" */}
                    <div className="grid w-full gap-1.5">
                      <Label htmlFor="description">
                        What problem would this feature solve for you?
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="e.g., 'I waste a lot of time manually comparing interview transcripts to find common themes...'"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                      />
                    </div>

                    {/* NEW "Priority" field */}
                    <div className="grid w-full gap-1.5">
                      <Label className="pb-4">
                        How important is this for you?
                      </Label>
                      <RadioGroup
                        defaultValue="Important"
                        value={priority}
                        onValueChange={setPriority}
                        className="grid grid-cols-3 gap-4"
                      >
                        <div>
                          <RadioGroupItem
                            value="Nice-to-Have"
                            id="p1"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="p1"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            Nice-to-Have
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="Important"
                            id="p2"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="p2"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            Important
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="Critical"
                            id="p3"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="p3"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            Critical
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" /> Submitting...
                        </>
                      ) : (
                        "Submit Feedback"
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RoadmapPage;
