"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import apiClient from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const ContactUsPage = () => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        uid: user ? user.uid : null,
      };

      // Replace the simulated API call with your actual apiClient
      await apiClient.post("/support/contact", payload);

      toast.success("Message Sent!", {
        description:
          "Thank you for reaching out. We'll get back to you shortly.",
      });

      // Reset the form, keeping user details if they are logged in
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        message: "",
      });
    } catch (error) {
      toast.error("Submission Failed", {
        description: "Something went wrong. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      <div className="py-24 md:py-32 lg:py-40 container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Get in Touch
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            We'd love to hear from you. Whether you have a question, feedback,
            or just want to say hello, please don't hesitate to reach out.
          </p>
        </header>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form Card */}
          <Card className="shadow-xl dark:bg-slate-900/70 w-full">
            <CardHeader>
              <CardTitle className="text-2xl">Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form and we'll be in touch as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Your message..."
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Company Information Card */}
          <div className="space-y-6">
            <Card className="shadow-xl dark:bg-slate-900/70">
              <CardHeader>
                <CardTitle className="text-2xl">About Embercore LLC</CardTitle>
                <CardDescription>
                  Building intelligent tools for content analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Who We Are
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Embercore LLC is the company behind Insights Crucible, an
                    AI-powered content analysis platform designed to transform
                    passive content consumption into actionable intelligence.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Our Mission
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    We empower professionals, researchers, and lifelong learners
                    to extract maximum value from podcasts, videos, and long-form
                    content through advanced AI analysis.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Company Address
                  </h3>
                  <address className="text-slate-600 dark:text-slate-400 not-italic">
                    Embercore LLC<br />
                    1401 21st ST #5866<br />
                    Sacramento, CA 95811<br />
                    United States
                  </address>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    For business inquiries, partnership opportunities, or support
                    questions, please use the contact form or reach out directly.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
