"use client";

import React from "react";
import { ArrowRight, Star } from "lucide-react";
import { CustomButton } from "@/components/common/CustomButton";
import { ROUTES } from "@/lib/constants";

export const CTASection: React.FC = () => (
  <section className="relative overflow-hidden py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
    {/* Background pattern */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
      <div className="max-w-4xl mx-auto">
        {/* Beta messaging */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-blue-100">
            🚀 Open Source Beta • Shape the future with your feedback
          </span>
        </div>

        <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-8">
          Ready to Transform Your Learning?
        </h2>

        <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed mb-12">
          Join our open-source beta and help us build the future of active learning from video content.
          <strong className="text-white block mt-2">
            Start with 30 free credits • No subscriptions, ever.
          </strong>
        </p>

        {/* Main CTA */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
          <CustomButton
            href={ROUTES.AUTH_SIGNUP}
            variant="primary"
            className="bg-white text-blue-600 hover:bg-blue-50 shadow-2xl px-8 py-4 text-lg font-semibold"
          >
            Get Started - 30 Free Credits
            <ArrowRight className="w-6 h-6" />
          </CustomButton>

          <div className="text-center">
            <CustomButton
              href={ROUTES.LIBRARY}
              variant="secondary"
              className="border-white/50 text-blue-500 hover:bg-white/80 px-6 py-3 font-medium"
            >
              Explore Public Library
            </CustomButton>
            <p className="mt-2 text-sm text-blue-200">
              See results before signing up
            </p>
          </div>
        </div>

        {/* Beta indicators */}
        <div className="border-t border-blue-500/30 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-blue-100">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>30 free credits to start</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>YouTube videos + uploaded content</span>
            </div>
          </div>

          <div className="mt-6 text-sm text-blue-200">
            Open source project • Community-driven development • Built for learners, by learners
          </div>
        </div>
      </div>
    </div>
  </section>
);
