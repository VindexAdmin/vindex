'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ChartData {
  time: string;
  price: number;
  volume: number;
}

export function TradingChart() {
  const [timeframe, setTimeframe] = useState<'1H' | '24H' | '7D' | '30D'>('24H');
  const [chartType, setChartType] = useState<'price' | 'volume'>('price');

  // Mock data - in production this would come from an API
  const generateMockData = (points: number): ChartData[] => {
    const data: ChartData[] = [];
    let basePrice = 1.0;
    
    for (let i = 0; i < points; i++) {
      const change = (Math.random() - 0.5) * 0.1;
      basePrice += change;
      basePrice = Math.max(0.5, Math.min(2.0, basePrice));
      
      data.push({
        time: new Date(Date.now() - (points - i) * 3600000).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        price: Number(basePrice.toFixed(4)),
        volume: Math.random() * 10000 + 1000,
      });
    }
    
    return data;
  };

  const chartData = generateMockData(timeframe === '1H' ? 12 : timeframe === '24H' ? 24 : timeframe === '7D' ? 168 : 720);
  
  const currentPrice = chartData[chartData.length - 1]?.price || 1.0;
  const previousPrice = chartData[chartData.length - 2]?.price || 1.0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = ((priceChange / previousPrice) * 100);
  
  const totalVolume = chartData.reduce((sum, item) => sum + item.volume, 0);

  const timeframes = ['1H', '24H', '7D', '30D'] as const;

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 border border-red-600/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">OC$/USDC Trading Chart</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white">
                ${currentPrice.toFixed(4)}
              </span>
              <div className={`flex items-center space-x-1 ${
                priceChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {priceChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Chart Type Toggle */}
          <div className="flex bg-gray-800/50 rounded-lg p-1">
            <button
              onClick={() => setChartType('price')}
              className={`px-3 py-1 rounded-md text-sm transition-all duration-200 ${
                chartType === 'price'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Price
            </button>
            <button
              onClick={() => setChartType('volume')}
              className={`px-3 py-1 rounded-md text-sm transition-all duration-200 ${
                chartType === 'volume'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Volume
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex bg-gray-800/50 rounded-lg p-1">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-md text-sm transition-all duration-200 ${
                  timeframe === tf
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'price' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                domain={['dataMin - 0.01', 'dataMax + 0.01']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #dc2626',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#dc2626"
                strokeWidth={2}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          ) : (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: number) => [`${value.toLocaleString()}`, 'Volume']}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#volumeGradient)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-sm">24h Volume</span>
          </div>
          <p className="text-white font-semibold">${totalVolume.toLocaleString()}</p>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-gray-400 text-sm">24h High</span>
          </div>
          <p className="text-white font-semibold">
            ${Math.max(...chartData.map(d => d.price)).toFixed(4)}
          </p>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-gray-400 text-sm">24h Low</span>
          </div>
          <p className="text-white font-semibold">
            ${Math.min(...chartData.map(d => d.price)).toFixed(4)}
          </p>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400 text-sm">Trades</span>
          </div>
          <p className="text-white font-semibold">{Math.floor(totalVolume / 100)}</p>
        </div>
      </div>
    </div>
  );
}