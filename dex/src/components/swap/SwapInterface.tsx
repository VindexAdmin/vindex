'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Settings, Zap, AlertTriangle } from 'lucide-react';
import BigNumber from 'bignumber.js';

interface Token {
  symbol: string;
  name: string;
  balance: string;
  price: number;
  logo?: string;
}

export function SwapInterface() {
  const [fromToken, setFromToken] = useState<Token>({
    symbol: 'OC$',
    name: 'OneChance',
    balance: '1,234.567890',
    price: 1.0,
  });

  const [toToken, setToToken] = useState<Token>({
    symbol: 'USDC',
    name: 'USD Coin',
    balance: '0.000000',
    price: 1.0,
  });

  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);

  const handleSwap = async () => {
    setIsLoading(true);
    // Simulate swap transaction
    setTimeout(() => {
      setIsLoading(false);
      setFromAmount('');
      setToAmount('');
    }, 2000);
  };

  const handleFlipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const calculateToAmount = (amount: string) => {
    if (!amount || isNaN(Number(amount))) return '';
    const rate = fromToken.price / toToken.price;
    return (Number(amount) * rate * (1 - slippage / 100)).toFixed(6);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    setToAmount(calculateToAmount(value));
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 border border-red-600/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Swap Tokens</h2>
        <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
          <Settings className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="space-y-4">
        {/* From Token */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">From</span>
            <span className="text-gray-400 text-sm">
              Balance: {fromToken.balance} {fromToken.symbol}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-gray-700 rounded-lg px-3 py-2">
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {fromToken.symbol.charAt(0)}
                </span>
              </div>
              <span className="text-white font-medium">{fromToken.symbol}</span>
            </div>
            
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent text-white text-xl font-medium placeholder-gray-500 outline-none text-right"
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleFlipTokens}
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600 transition-all duration-200 hover:border-red-600"
          >
            <ArrowUpDown className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* To Token */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">To</span>
            <span className="text-gray-400 text-sm">
              Balance: {toToken.balance} {toToken.symbol}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-gray-700 rounded-lg px-3 py-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {toToken.symbol.charAt(0)}
                </span>
              </div>
              <span className="text-white font-medium">{toToken.symbol}</span>
            </div>
            
            <input
              type="number"
              value={toAmount}
              readOnly
              placeholder="0.0"
              className="flex-1 bg-transparent text-white text-xl font-medium placeholder-gray-500 outline-none text-right"
            />
          </div>
        </div>

        {/* Swap Details */}
        {fromAmount && toAmount && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gray-800/30 rounded-xl p-4 space-y-2"
          >
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Rate</span>
              <span className="text-white">
                1 {fromToken.symbol} = {(fromToken.price / toToken.price).toFixed(6)} {toToken.symbol}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Slippage Tolerance</span>
              <span className="text-white">{slippage}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Network Fee</span>
              <span className="text-white">~0.001 OC$</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Auto-Burn</span>
              <span className="text-red-400">0.001 OC$</span>
            </div>
          </motion.div>
        )}

        {/* Warning */}
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-200 text-sm">
              Each swap burns 0.001 OC$ to reduce total supply
            </span>
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!fromAmount || !toAmount || isLoading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Swapping...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Swap Tokens</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}