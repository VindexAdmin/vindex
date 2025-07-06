'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Users, Globe, TrendingUp, Lock, Coins, Network } from 'lucide-react';
import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { EcosystemSection } from '@/components/sections/EcosystemSection';
import { RoadmapSection } from '@/components/sections/RoadmapSection';
import { TeamSection } from '@/components/sections/TeamSection';
import { CTASection } from '@/components/sections/CTASection';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <EcosystemSection />
      <RoadmapSection />
      <TeamSection />
      <CTASection />
    </div>
  );
}