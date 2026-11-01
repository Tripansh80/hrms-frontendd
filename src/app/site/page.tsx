"use client";

import { HeroSection } from "@/components/site/HeroSection";
import { AIAssistantSection } from "@/components/site/AIAssistantSection";
import { FeaturesSection } from "@/components/site/FeaturesSection";
import { AIWorkflowStrip } from "@/components/site/AIWorkflowStrip";
import { RoleValueSection } from "@/components/site/RoleValueSection";
import { SecuritySection } from "@/components/site/SecuritySection";
import { CTASection } from "@/components/site/CTASection";

export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <AIAssistantSection />
      <FeaturesSection />
      <AIWorkflowStrip />
      <RoleValueSection />
      <SecuritySection />
      <CTASection />
    </main>
  );
}
