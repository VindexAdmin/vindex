'use client';

import { motion } from 'framer-motion';
import { Flame, TrendingDown, Clock, Target } from 'lucide-react';

export function BurnStats() {
  // Mock data - in production this would come from an API
  const burnData = {
    totalBurned: '12,345,678.901234',
    burnRate: '0.001',
    lastBurn: '2 minutes ago',
    nextBurn: '4 hours',
    burnTarget: '100,000,000',
    currentSupply: '987,654,321.098766',
    burnProgress: 12.35, // percentage
  };

  const formatNumber = (num: string) => {
    return parseFloat(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 border border-red-600/20">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
          <Flame className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Auto-Burn Statistics</h3>
          <p className="text-gray-400 text-sm">Deflationary mechanism reducing OC$ supply</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="space-y-6">
        {/* Total Burned */}
        <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-xl p-4 border border-red-600/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300 text-sm">Total OC$ Burned</span>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Flame className="w-5 h-5 text-red-400" />
            </motion.div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatNumber(burnData.totalBurned)} OC$
          </p>
          <p className="text-red-400 text-sm">
            {burnData.burnProgress.toFixed(2)}% of burn target reached
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Burn Progress</span>
            <span className="text-white">{burnData.burnProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-red-600 to-orange-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${burnData.burnProgress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0 OC$</span>
            <span>{formatNumber(burnData.burnTarget)} OC$ Target</span>
          </div>
        </div>

        {/* Burn Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-gray-400 text-sm">Per Swap</span>
            </div>
            <p className="text-white font-semibold">{burnData.burnRate} OC$</p>
          </div>

          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400 text-sm">Last Burn</span>
            </div>
            <p className="text-white font-semibold">{burnData.lastBurn}</p>
          </div>
        </div>

        {/* Current Supply */}
        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-gray-400 text-sm">Current Supply</span>
          </div>
          <p className="text-white font-semibold text-lg">
            {formatNumber(burnData.currentSupply)} OC$
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Down from 1,000,000,000 OC$ initial supply
          </p>
        </div>

        {/* Burn Mechanism Info */}
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
          <h4 className="text-yellow-200 font-semibold mb-2">How Auto-Burn Works</h4>
          <ul className="text-yellow-100 text-sm space-y-1">
            <li>• 0.001 OC$ burned on every swap transaction</li>
            <li>• 1% monthly burn on inactive accounts (6+ months)</li>
            <li>• Burns stop when supply reaches 100M OC$</li>
            <li>• Creates deflationary pressure on token price</li>
          </ul>
        </div>

        {/* Live Burn Feed */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold">Recent Burns</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {[
              { amount: '0.001', time: '2 min ago', type: 'Swap' },
              { amount: '0.001', time: '5 min ago', type: 'Swap' },
              { amount: '0.001', time: '8 min ago', type: 'Swap' },
              { amount: '123.456', time: '1 hour ago', type: 'Inactive Account' },
            ].map((burn, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between bg-gray-800/20 rounded-lg p-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm font-medium">
                    {burn.amount} OC$
                  </span>
                  <span className="text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded">
                    {burn.type}
                  </span>
                </div>
                <span className="text-gray-400 text-xs">{burn.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}