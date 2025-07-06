import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Wallet, Send, Receive, History, Settings, Plus } from 'lucide-react';
import { WalletSetup } from './components/WalletSetup';
import { Dashboard } from './components/Dashboard';
import { SendTokens } from './components/SendTokens';
import { ReceiveTokens } from './components/ReceiveTokens';
import { TransactionHistory } from './components/TransactionHistory';
import { TokenManagement } from './components/TokenManagement';
import { WalletSettings } from './components/WalletSettings';
import { useWalletStore } from '../store/walletStore';
import { Toaster } from 'react-hot-toast';

type View = 'setup' | 'dashboard' | 'send' | 'receive' | 'history' | 'tokens' | 'settings';

export function App() {
  const [currentView, setCurrentView] = useState<View>('setup');
  const { isUnlocked, hasWallet } = useWalletStore();

  useEffect(() => {
    if (hasWallet && isUnlocked) {
      setCurrentView('dashboard');
    } else if (hasWallet && !isUnlocked) {
      setCurrentView('setup');
    } else {
      setCurrentView('setup');
    }
  }, [hasWallet, isUnlocked]);

  const navigation = [
    { id: 'dashboard', label: 'Wallet', icon: <Wallet className="w-5 h-5" /> },
    { id: 'send', label: 'Send', icon: <Send className="w-5 h-5" /> },
    { id: 'receive', label: 'Receive', icon: <Receive className="w-5 h-5" /> },
    { id: 'history', label: 'History', icon: <History className="w-5 h-5" /> },
    { id: 'tokens', label: 'Tokens', icon: <Plus className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'setup':
        return <WalletSetup onComplete={() => setCurrentView('dashboard')} />;
      case 'dashboard':
        return <Dashboard />;
      case 'send':
        return <SendTokens onBack={() => setCurrentView('dashboard')} />;
      case 'receive':
        return <ReceiveTokens onBack={() => setCurrentView('dashboard')} />;
      case 'history':
        return <TransactionHistory onBack={() => setCurrentView('dashboard')} />;
      case 'tokens':
        return <TokenManagement onBack={() => setCurrentView('dashboard')} />;
      case 'settings':
        return <WalletSettings onBack={() => setCurrentView('dashboard')} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="w-[400px] h-[600px] bg-black text-white flex flex-col">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #dc2626',
          },
        }}
      />

      {/* Header */}
      {hasWallet && isUnlocked && currentView !== 'setup' && (
        <div className="bg-gray-900 border-b border-red-600/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">VindexWallet</h1>
                <p className="text-xs text-gray-400">VindexChain Network</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      {hasWallet && isUnlocked && currentView !== 'setup' && (
        <div className="bg-gray-900 border-t border-red-600/20 p-2">
          <div className="grid grid-cols-3 gap-1">
            {navigation.slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                  currentView === item.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.icon}
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}