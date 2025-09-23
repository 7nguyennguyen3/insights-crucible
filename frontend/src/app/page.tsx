// /app/page.tsx

"use client";

import React from "react";
import { HeroSection } from "@/components/home/HeroSection/HeroSection";
import { TeamSection } from "@/components/home/TeamSection/TeamSection";
import { PricingSection } from "@/components/home/PricingSection/PricingSection";
import { CTASection } from "@/components/home/CTASection/CTASection";

const MarketingHomePage: React.FC = () => {
  return (
    <>
      <HeroSection />
      <TeamSection />
      <PricingSection />
      <CTASection />
    </>
  );
};

export default MarketingHomePage;
