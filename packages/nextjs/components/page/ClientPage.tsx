"use client";

import { useEffect, useState } from "react";
// import CommunitySection from "~~/components/page/CommunitySection";
import FeaturesSection from "~~/components/page/FeaturesSection";
import Footer from "~~/components/page/Footer";
import GameMechanics from "~~/components/page/GameMechanics";
import HeroSection from "~~/components/page/HeroSection";
import InvestmentCTA from "~~/components/page/InvestmentCTA";
import Navigation from "~~/components/page/Navigation";
import RoadmapSection from "~~/components/page/RoadmapSection";
import TokenomicsSection from "~~/components/page/TokenomicsSection";

export default function ClientPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state instead of null for better UX
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Static navigation can be shown immediately */}
        <div className="animate-pulse">
          <div className="h-16 bg-slate-800/20 backdrop-blur-sm"></div>
          <div className="h-screen flex items-center justify-center">
            <div className="text-white/60">Loading UniRamble...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <HeroSection />

      {/* Game Mechanics Preview */}
      <GameMechanics />

      {/* Value Proposition Tabs */}
      <FeaturesSection />

      {/* Tokenomics */}
      <TokenomicsSection />

      {/* Roadmap */}
      <RoadmapSection />

      {/* Community & Social Proof
      <CommunitySection />
      */}

      {/* Final CTA */}
      <InvestmentCTA />

      {/* Footer */}
      <Footer />
    </div>
  );
}
