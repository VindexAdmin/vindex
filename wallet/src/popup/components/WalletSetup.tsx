import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, EyeOff, Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { useWalletStore } from '../../store/walletStore';
import { generateMnemonic, validateMnemonic } from '../../utils/crypto';
import toast from 'react-hot-toast';

interface WalletSetupProps {
  onComplete: () => void;
}

type SetupStep = 'welcome' | 'create-or-import' | 'create-wallet' | 'backup-phrase' | 'verify-phrase' | 'import-wallet' | 'set-password' | 'complete';

export function WalletSetup({ onComplete }: WalletSetupProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [mnemonic, setMnemonic] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [importMnemonic, setImportMnemonic] = useState('');
  const [verificationWords, setVerificationWords] = useState<number[]>([]);
  const [verificationInput, setVerificationInput] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [backedUp, setBackedUp] = useState(false);

  const { createWallet, importWallet } = useWalletStore();

  const handleCreateWallet = async () => {
    try {
      const newMnemonic = generateMnemonic();
      setMnemonic(newMnemonic);
      
      // Generate random word positions for verification
      const words = newMnemonic.split(' ');
      const randomPositions = [];
      while (randomPositions.length < 3) {
        const pos = Math.floor(Math.random() * 12);
        if (!randomPositions.includes(pos)) {
          randomPositions.push(pos);
        }
      }
      setVerificationWords(randomPositions.sort((a, b) => a - b));
      setVerificationInput(new Array(3).fill(''));
      
      setCurrentStep('backup-phrase');
    } catch (error) {
      toast.error('Failed to generate wallet');
    }
  };

  const handleImportWallet = async () => {
    try {
      if (!validateMnemonic(importMnemonic)) {
        toast.error('Invalid recovery phrase');
        return;
      }
      
      setMnemonic(importMnemonic);
      setCurrentStep('set-password');
    } catch (error) {
      toast.error('Failed to import wallet');
    }
  };

  const handleVerifyPhrase = () => {
    const words = mnemonic.split(' ');
    const isValid = verificationWords.every((pos, index) => {
      return verificationInput[index].toLowerCase().trim() === words[pos].toLowerCase();
    });

    if (isValid) {
      setCurrentStep('set-password');
    } else {
      toast.error('Verification failed. Please check the words.');
      setVerificationInput(new Array(3).fill(''));
    }
  };

  const handleSetPassword = async () => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      if (currentStep === 'set-password' && importMnemonic) {
        await importWallet(mnemonic, password);
      } else {
        await createWallet(mnemonic, password);
      }
      
      setCurrentStep('complete');
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      toast.error('Failed to create wallet');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to VindexWallet</h2>
              <p className="text-gray-400">Your gateway to the VindexChain ecosystem</p>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-white mb-2">🛡️ Secure</h3>
                <p className="text-gray-400 text-sm">Your keys are encrypted and stored locally</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-white mb-2">⚡ Fast</h3>
                <p className="text-gray-400 text-sm">Instant transactions on VindexChain</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-white mb-2">🌐 Complete</h3>
                <p className="text-gray-400 text-sm">Access to staking, DEX, and token factory</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentStep('create-or-import')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Get Started
            </button>
          </div>
        );

      case 'create-or-import':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Setup Wallet</h2>
              <p className="text-gray-400">Create a new wallet or import an existing one</p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleCreateWallet}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-3"
              >
                <Download className="w-5 h-5" />
                <span>Create New Wallet</span>
              </button>
              
              <button
                onClick={() => setCurrentStep('import-wallet')}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-3"
              >
                <Upload className="w-5 h-5" />
                <span>Import Existing Wallet</span>
              </button>
            </div>
          </div>
        );

      case 'backup-phrase':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Backup Your Wallet</h2>
              <p className="text-gray-400">Write down these 12 words in order. Keep them safe!</p>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span className="text-yellow-500 font-semibold">Important</span>
              </div>
              <p className="text-yellow-200 text-sm">
                Never share your recovery phrase. Anyone with these words can access your wallet.
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {mnemonic.split(' ').map((word, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-3 text-center">
                    <span className="text-gray-400 text-xs">{index + 1}</span>
                    <div className="text-white font-medium">{word}</div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => copyToClipboard(mnemonic)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Copy to Clipboard
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={backedUp}
                  onChange={(e) => setBackedUp(e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                />
                <span className="text-white text-sm">I have safely backed up my recovery phrase</span>
              </label>
            </div>

            <button
              onClick={() => setCurrentStep('verify-phrase')}
              disabled={!backedUp}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        );

      case 'verify-phrase':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Verify Recovery Phrase</h2>
              <p className="text-gray-400">Enter the requested words to verify your backup</p>
            </div>

            <div className="space-y-4">
              {verificationWords.map((wordIndex, index) => (
                <div key={index}>
                  <label className="block text-white text-sm font-medium mb-2">
                    Word #{wordIndex + 1}
                  </label>
                  <input
                    type="text"
                    value={verificationInput[index]}
                    onChange={(e) => {
                      const newInput = [...verificationInput];
                      newInput[index] = e.target.value;
                      setVerificationInput(newInput);
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter word"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleVerifyPhrase}
              disabled={verificationInput.some(word => !word.trim())}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Verify
            </button>
          </div>
        );

      case 'import-wallet':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Import Wallet</h2>
              <p className="text-gray-400">Enter your 12-word recovery phrase</p>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Recovery Phrase
              </label>
              <textarea
                value={importMnemonic}
                onChange={(e) => setImportMnemonic(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent h-24 resize-none"
                placeholder="Enter your 12-word recovery phrase separated by spaces"
              />
            </div>

            <button
              onClick={handleImportWallet}
              disabled={!importMnemonic.trim()}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Import Wallet
            </button>
          </div>
        );

      case 'set-password':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Set Password</h2>
              <p className="text-gray-400">Secure your wallet with a strong password</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pr-12 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter password (min 8 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                />
                <span className="text-white text-sm">
                  I agree to the{' '}
                  <a href="#" className="text-red-400 hover:text-red-300">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-red-400 hover:text-red-300">Privacy Policy</a>
                </span>
              </label>
            </div>

            <button
              onClick={handleSetPassword}
              disabled={!password || !confirmPassword || !agreedToTerms || password !== confirmPassword}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Create Wallet
            </button>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Wallet Created!</h2>
              <p className="text-gray-400">Your VindexWallet is ready to use</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-left space-y-2">
              <p className="text-white font-medium">🎉 Welcome to VindexChain!</p>
              <p className="text-gray-400 text-sm">You can now:</p>
              <ul className="text-gray-400 text-sm space-y-1 ml-4">
                <li>• Send and receive OC$ tokens</li>
                <li>• Stake tokens to earn rewards</li>
                <li>• Trade on BurnSwap DEX</li>
                <li>• Create tokens and domains</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress indicator */}
      {currentStep !== 'welcome' && currentStep !== 'complete' && (
        <div className="p-4 border-t border-gray-700">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Setup Progress</span>
            <span>
              {currentStep === 'create-or-import' ? '1' :
               currentStep === 'create-wallet' || currentStep === 'import-wallet' ? '2' :
               currentStep === 'backup-phrase' ? '3' :
               currentStep === 'verify-phrase' ? '4' :
               currentStep === 'set-password' ? '5' : '6'}/5
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  currentStep === 'create-or-import' ? 20 :
                  currentStep === 'create-wallet' || currentStep === 'import-wallet' ? 40 :
                  currentStep === 'backup-phrase' ? 60 :
                  currentStep === 'verify-phrase' ? 80 :
                  currentStep === 'set-password' ? 100 : 0
                }%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}