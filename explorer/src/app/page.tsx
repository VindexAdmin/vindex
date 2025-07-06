'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Users, Zap, Shield } from 'lucide-react';
import { SearchBar } from '@/components/search/SearchBar';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentBlocks } from '@/components/dashboard/RecentBlocks';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { NetworkStats } from '@/components/dashboard/NetworkStats';
import { ValidatorsList } from '@/components/dashboard/ValidatorsList';
import { useNetworkStats } from '@/hooks/useNetworkStats';

export default function HomePage() {
  const { data: stats, isLoading } = useNetworkStats();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent" />
        <motion.div
          className="relative max-w-7xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-full mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
              VindexScan
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Explore the VindexChain blockchain - The first blockchain of Puerto Rico 🇵🇷
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-12">
            <SearchBar />
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          >
            <StatsCard
              title="Total Supply"
              value={stats?.totalSupply || '0'}
              suffix="OC$"
              icon={<TrendingUp className="w-6 h-6" />}
              trend="+2.5%"
              loading={isLoading}
            />
            <StatsCard
              title="Active Validators"
              value={stats?.activeValidators || '0'}
              icon={<Users className="w-6 h-6" />}
              loading={isLoading}
            />
            <StatsCard
              title="Network TPS"
              value={stats?.currentTPS || '0'}
              suffix="TPS"
              icon={<Zap className="w-6 h-6" />}
              loading={isLoading}
            />
            <StatsCard
              title="Avg Block Time"
              value={stats?.avgBlockTime || '0'}
              suffix="s"
              icon={<Shield className="w-6 h-6" />}
              loading={isLoading}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Dashboard Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              <RecentBlocks />
              <RecentTransactions />
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <NetworkStats />
              <ValidatorsList />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}