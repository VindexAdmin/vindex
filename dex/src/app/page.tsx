'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, BarChart3, Droplets } from 'lucide-react';
import { SwapInterface } from '@/components/swap/SwapInterface';
import { PoolsOverview } from '@/components/pools/PoolsOverview';
import { TradingChart } from '@/components/charts/TradingChart';
import { BurnStats } from '@/components/stats/BurnStats';
import { RecentTrades } from '@/components/trades/RecentTrades';

export default function DEXPage() {
  const [activeTab, setActiveTab] = useState<'swap' | 'pools' | 'analytics'>('swap');

  const tabs = [
    { id: 'swap', label: 'Swap', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'pools', label: 'Pools', icon: <Droplets className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-red-600/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">BurnSwap</h1>
                <p className="text-gray-400">Native DEX for VindexChain</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-gray-800/50 rounded-full p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-full transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'swap' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <SwapInterface />
              </div>
              <div className="space-y-6">
                <BurnStats />
                <RecentTrades />
              </div>
            </div>
          )}

          {activeTab === 'pools' && (
            <div className="space-y-8">
              <PoolsOverview />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <TradingChart />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <BurnStats />
                <RecentTrades />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}