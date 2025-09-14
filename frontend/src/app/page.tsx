// /app/page.tsx

"use client";

import React from "react";
import { UseCasesSection } from "@/components/home/UseCasesSection/UseCasesSection";
import { CTASection } from "@/components/home/CTASection/CTASection";
import { PricingSection } from "@/components/home/PricingSection/PricingSection";
import { HeroSection } from "@/components/home/HeroSection/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection/HowItWorksSection";
import { BenefitsSection } from "@/components/home/BenefitsSection/BenefitsSection";

const MarketingHomePage: React.FC = () => {
  return (
    <>
      <HeroSection />
      <BenefitsSection />
      <HowItWorksSection />
      <UseCasesSection />
      <PricingSection />
      <CTASection />
    </>
  );
};

export default MarketingHomePage;
