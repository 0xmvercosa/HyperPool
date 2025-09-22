'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Loader2, ArrowDown } from 'lucide-react';
import { useWallet } from '@/lib/hooks/useWallet';
import { useSwap } from '@/lib/hooks/useSwap';
import toast from 'react-hot-toast';

interface AddLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: {
    id: string;
    name: string;
    description: string;
    apy: number;
    tokens: Array<{ symbol: string }>;
  } | null;
}

export const AddLiquidityModal = ({ isOpen, onClose, pool }: AddLiquidityModalProps) => {
  const { balance, isConnected } = useWallet();
  const { executeSwap, isLoading: isSwapping } = useSwap();
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset amount when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
    }
  }, [isOpen]);

  if (!pool) return null;

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > (balance?.usdc || 0)) {
      toast.error('Insufficient USDC balance');
      return;
    }

    setIsProcessing(true);
    try {
      // Here we'll execute the swap based on the pool strategy
      const amountInWei = (parseFloat(amount) * 1e6).toString(); // USDC has 6 decimals

      // For now, we'll use a default 50/50 split for HYPE/USDT
      // In production, each pool would have its own allocation strategy
      await executeSwap({
        amountIn: amountInWei,
        distribution: { hype: 50, usdt: 50 }
      });

      toast.success(`Successfully added $${amount} to ${pool.name} pool`);
      onClose();
    } catch (error: any) {
      console.error('Failed to add liquidity:', error);
      toast.error(error.message || 'Failed to add liquidity');
    } finally {
      setIsProcessing(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const contentVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { scale: 1, opacity: 1 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={onClose}
        >
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
            className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Add Liquidity</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pool Info */}
            <div className="bg-zinc-800 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white">{pool.name}</h3>
                <span className="text-[#8CFF00] font-bold">{pool.apy}% APY</span>
              </div>
              <p className="text-gray-400 text-sm">{pool.description}</p>
            </div>

            {/* Input Section */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Amount (USDC)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-lg placeholder:text-gray-500 focus:outline-none focus:border-[#8CFF00] transition-colors"
                  />
                  <button
                    onClick={() => setAmount(balance?.usdc?.toString() || '0')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8CFF00] text-sm font-medium hover:text-[#7AE600] transition-colors"
                  >
                    MAX
                  </button>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Balance: {balance?.usdc?.toFixed(2) || '0.00'} USDC
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                  <ArrowDown className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Output Preview */}
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-2">You will receive:</p>
                <div className="space-y-2">
                  {pool.tokens.map((token, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-white font-medium">{token.symbol}</span>
                      <span className="text-gray-400">
                        ~{amount ? (parseFloat(amount) / pool.tokens.length).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-3 mb-6 flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-400 mt-0.5" />
              <p className="text-gray-400 text-xs">
                Your funds will be automatically allocated according to the {pool.name} strategy.
                You can withdraw at any time.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isProcessing || isSwapping}
                className="flex-1 px-6 py-3 rounded-xl border border-zinc-700 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!amount || parseFloat(amount) <= 0 || isProcessing || isSwapping || !isConnected}
                className="flex-1 px-6 py-3 rounded-xl bg-[#8CFF00] hover:bg-[#7AE600] text-black font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {(isProcessing || isSwapping) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Add Liquidity</span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};