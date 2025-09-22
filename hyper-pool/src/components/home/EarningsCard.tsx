'use client';

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface EarningsCardProps {
  totalEarnings: number;
  dailyChange: number;
  percentageChange: number;
  investedBalance?: number;
  availableFees?: number;
  onCollectFees?: () => void;
}

export const EarningsCard = ({
  totalEarnings = 0,
  dailyChange = 0,
  percentageChange = 0,
  investedBalance = 0,
  availableFees = 0,
  onCollectFees
}: EarningsCardProps) => {
  const [isCollecting, setIsCollecting] = useState(false);

  const handleCollectFees = async () => {
    if (!onCollectFees || availableFees <= 0) return;

    setIsCollecting(true);
    try {
      await onCollectFees();
      toast.success(`Collected $${availableFees.toFixed(2)} in fees!`);
    } catch (error) {
      toast.error('Failed to collect fees');
    } finally {
      setIsCollecting(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-zinc-900 rounded-2xl p-6 relative overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(140, 255, 0, 0.3) 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }}
        />
      </div>

      <div className="relative">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-gray-400 text-sm mb-2">Total Invested</p>
            {/* Invested Balance */}
            <div className="mb-3">
              <span className="text-4xl font-bold text-white">
                ${investedBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            {/* Daily Change */}
            <div className="flex items-center gap-2">
              <span className={`text-lg font-medium ${dailyChange >= 0 ? 'text-[#8CFF00]' : 'text-red-500'}`}>
                {dailyChange >= 0 ? '+' : ''}{dailyChange > 0 ? `$${dailyChange.toFixed(0)}` : '$0'}
              </span>
              <span className="text-gray-500 text-sm">
                {percentageChange.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Fees Section */}
          {availableFees > 0 && (
            <div className="text-right">
              <p className="text-gray-400 text-xs mb-1">Available Fees</p>
              <p className="text-[#8CFF00] font-semibold text-lg mb-2">
                ${availableFees.toFixed(2)}
              </p>
              <button
                onClick={handleCollectFees}
                disabled={isCollecting || availableFees <= 0}
                className="px-3 py-1.5 bg-[#8CFF00] hover:bg-[#7AE600] text-black text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCollecting ? 'Collecting...' : 'Collect'}
              </button>
            </div>
          )}
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">Total Earnings</span>
            </div>
            <span className="text-white font-semibold">
              ${totalEarnings.toFixed(2)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">APY</span>
            </div>
            <span className="text-white font-semibold">
              {percentageChange > 0 ? `${percentageChange.toFixed(1)}%` : '0.0%'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Wallet className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">Positions</span>
            </div>
            <span className="text-white font-semibold">
              {investedBalance > 0 ? '2' : '0'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};