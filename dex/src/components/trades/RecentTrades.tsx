'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, ExternalLink, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  price: string;
  timestamp: string;
  txHash: string;
  trader: string;
}

export function RecentTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Mock data generator
  const generateMockTrade = (): Trade => {
    const isBuy = Math.random() > 0.5;
    const baseAmount = (Math.random() * 1000 + 10).toFixed(2);
    const price = (0.8 + Math.random() * 0.4).toFixed(4);
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      type: isBuy ? 'buy' : 'sell',
      tokenIn: isBuy ? 'USDC' : 'OC$',
      tokenOut: isBuy ? 'OC$' : 'USDC',
      amountIn: baseAmount,
      amountOut: (parseFloat(baseAmount) * parseFloat(price)).toFixed(4),
      price,
      timestamp: new Date().toLocaleTimeString(),
      txHash: '0x' + Math.random().toString(16).substr(2, 8),
      trader: 'vindex1' + Math.random().toString(36).substr(2, 6),
    };
  };

  // Initialize with mock data
  useEffect(() => {
    const initialTrades = Array.from({ length: 10 }, generateMockTrade);
    setTrades(initialTrades);
  }, []);

  // Simulate live trades
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newTrade = generateMockTrade();
      setTrades(prev => [newTrade, ...prev.slice(0, 19)]); // Keep last 20 trades
    }, 3000 + Math.random() * 5000); // Random interval between 3-8 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 border border-red-600/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
            <ArrowUpDown className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Recent Trades</h3>
            <p className="text-gray-400 text-sm">Live trading activity</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-gray-400 text-sm">{isLive ? 'Live' : 'Paused'}</span>
          </div>
          <button
            onClick={() => setIsLive(!isLive)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
          >
            {isLive ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* Trades Table Header */}
      <div className="grid grid-cols-12 gap-4 text-gray-400 text-sm font-medium mb-4 px-2">
        <div className="col-span-2">Type</div>
        <div className="col-span-3">Amount</div>
        <div className="col-span-2">Price</div>
        <div className="col-span-2">Time</div>
        <div className="col-span-2">Trader</div>
        <div className="col-span-1">Tx</div>
      </div>

      {/* Trades List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {trades.map((trade, index) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-12 gap-4 items-center bg-gray-800/30 hover:bg-gray-800/50 rounded-lg p-3 transition-all duration-200"
            >
              {/* Type */}
              <div className="col-span-2">
                <div className={`flex items-center space-x-2 ${
                  trade.type === 'buy' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trade.type === 'buy' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="font-medium capitalize">{trade.type}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="col-span-3">
                <div className="text-white text-sm">
                  <div>{formatAmount(trade.amountIn)} {trade.tokenIn}</div>
                  <div className="text-gray-400 text-xs">
                    {formatAmount(trade.amountOut)} {trade.tokenOut}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="col-span-2">
                <span className="text-white font-medium">${trade.price}</span>
              </div>

              {/* Time */}
              <div className="col-span-2">
                <div className="flex items-center space-x-1 text-gray-400 text-sm">
                  <Clock className="w-3 h-3" />
                  <span>{trade.timestamp}</span>
                </div>
              </div>

              {/* Trader */}
              <div className="col-span-2">
                <span className="text-gray-300 text-sm font-mono">
                  {formatAddress(trade.trader)}
                </span>
              </div>

              {/* Transaction Link */}
              <div className="col-span-1">
                <button
                  onClick={() => window.open(`/tx/${trade.txHash}`, '_blank')}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="View transaction"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-700/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-gray-400 text-sm">Total Trades</p>
            <p className="text-white font-semibold">{trades.length}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Buy/Sell Ratio</p>
            <p className="text-white font-semibold">
              {trades.filter(t => t.type === 'buy').length}/
              {trades.filter(t => t.type === 'sell').length}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Avg. Trade Size</p>
            <p className="text-white font-semibold">
              ${(trades.reduce((sum, t) => sum + parseFloat(t.amountIn), 0) / trades.length || 0).toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {trades.length === 0 && (
        <div className="text-center py-8">
          <ArrowUpDown className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h4 className="text-white font-semibold mb-2">No trades yet</h4>
          <p className="text-gray-400 text-sm">
            Trades will appear here as they happen on the network
          </p>
        </div>
      )}
    </div>
  );
}