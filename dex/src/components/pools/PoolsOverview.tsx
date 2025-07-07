'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, Droplets, ExternalLink } from 'lucide-react';

interface Pool {
  id: string;
  tokenA: string;
  tokenB: string;
  tvl: string;
  apr: string;
  volume24h: string;
  fees24h: string;
  myLiquidity?: string;
}

export function PoolsOverview() {
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  const pools: Pool[] = [
    {
      id: '1',
      tokenA: 'OC$',
      tokenB: 'USDC',
      tvl: '$1,234,567',
      apr: '12.5%',
      volume24h: '$89,432',
      fees24h: '$894',
      myLiquidity: '$5,678',
    },
    {
      id: '2',
      tokenA: 'OC$',
      tokenB: 'WETH',
      tvl: '$567,890',
      apr: '18.3%',
      volume24h: '$45,123',
      fees24h: '$451',
    },
    {
      id: '3',
      tokenA: 'USDC',
      tokenB: 'WETH',
      tvl: '$890,123',
      apr: '8.7%',
      volume24h: '$67,890',
      fees24h: '$679',
    },
  ];

  const myPools = pools.filter(pool => pool.myLiquidity);

  const displayPools = activeTab === 'all' ? pools : myPools;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Liquidity Pools</h2>
          <p className="text-gray-400">Provide liquidity and earn fees from trades</p>
        </div>
        <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Liquidity</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl p-6 border border-red-600/20">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
              <Droplets className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Total TVL</h3>
              <p className="text-gray-400 text-sm">All pools combined</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">$2,691,580</p>
          <p className="text-green-400 text-sm mt-1">+5.2% (24h)</p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl p-6 border border-red-600/20">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">24h Volume</h3>
              <p className="text-gray-400 text-sm">Trading volume</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">$202,445</p>
          <p className="text-green-400 text-sm mt-1">+12.8% (24h)</p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl p-6 border border-red-600/20">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <span className="text-green-400 font-bold">$</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">24h Fees</h3>
              <p className="text-gray-400 text-sm">Protocol fees</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">$2,024</p>
          <p className="text-green-400 text-sm mt-1">+12.8% (24h)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-800/50 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 ${
            activeTab === 'all'
              ? 'bg-red-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          All Pools
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 ${
            activeTab === 'my'
              ? 'bg-red-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          My Positions ({myPools.length})
        </button>
      </div>

      {/* Pools Table */}
      <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-red-600/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Pool</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">TVL</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">APR</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">24h Volume</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">24h Fees</th>
                {activeTab === 'my' && (
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">My Liquidity</th>
                )}
                <th className="text-right py-4 px-6 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayPools.map((pool, index) => (
                <motion.tr
                  key={pool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-t border-gray-700/50 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center border-2 border-gray-900">
                          <span className="text-white text-xs font-bold">
                            {pool.tokenA.charAt(0)}
                          </span>
                        </div>
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-gray-900">
                          <span className="text-white text-xs font-bold">
                            {pool.tokenB.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {pool.tokenA}/{pool.tokenB}
                        </p>
                        <p className="text-gray-400 text-sm">0.01% fee</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-white font-medium">{pool.tvl}</td>
                  <td className="py-4 px-6">
                    <span className="text-green-400 font-medium">{pool.apr}</span>
                  </td>
                  <td className="py-4 px-6 text-white">{pool.volume24h}</td>
                  <td className="py-4 px-6 text-white">{pool.fees24h}</td>
                  {activeTab === 'my' && (
                    <td className="py-4 px-6 text-white font-medium">
                      {pool.myLiquidity || '-'}
                    </td>
                  )}
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm transition-colors">
                        Add
                      </button>
                      {pool.myLiquidity && (
                        <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors">
                          Remove
                        </button>
                      )}
                      <button className="p-1 text-gray-400 hover:text-white transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {displayPools.length === 0 && (
        <div className="text-center py-12">
          <Droplets className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">
            {activeTab === 'my' ? 'No liquidity positions' : 'No pools found'}
          </h3>
          <p className="text-gray-400 mb-6">
            {activeTab === 'my'
              ? 'Add liquidity to a pool to start earning fees'
              : 'Be the first to create a liquidity pool'}
          </p>
          <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            Add Liquidity
          </button>
        </div>
      )}
    </div>
  );
}