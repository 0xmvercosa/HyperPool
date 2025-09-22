'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/hooks/useWallet';
import { ArrowUp, ArrowDown, MoreHorizontal, DollarSign, ExternalLink, Hash, Droplets } from 'lucide-react';
import Image from 'next/image';
import { TOKEN_LOGOS } from '@/lib/constants/tokens';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// Real position data from HyperSwap V3
const realPosition = {
  id: 'hyperswap-v3-position',
  protocol: 'HyperSwap V3',
  type: 'multicall',
  name: 'HYPE/USDT',
  tokens: ['HYPE', 'USDT'],
  tokenAmounts: {
    HYPE: -0.0073,
    USDT: -0.4985
  },
  nftId: 147362,
  value: 0.4985, // Current value in USDT
  profit: 0, // To be calculated based on entry
  profitPercent: 0,
  gasUsed: 0.0004, // HYPE
  gasValue: 0.0203, // USD
  txHash: '0x8a8a...d001', // Shortened for display
  fullTxHash: '0x8a8ab010901bc69c1a46ff4e5f7a201634f74599347b25379b01c286d52ad001', // Full hash for link
  timestamp: '2025/09/21 11:23',
  explorerUrl: 'https://hyperevmscan.io/tx/'
};

export default function Portfolio() {
  const { isConnected, balance } = useWallet();
  const [showAllAssets, setShowAllAssets] = useState(false);

  // Use real position
  const positions = [realPosition];

  // Calculate totals based on real position
  const totalValue = realPosition.value;
  const totalProfit = realPosition.profit;
  const totalProfitPercent = realPosition.profitPercent;

  // No claimable rewards for now
  const claimableRewards = 0;

  const handleClaim = async () => {
    try {
      // Mock claim process
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Successfully claimed $${claimableRewards.toFixed(2)}`);
    } catch (error) {
      toast.error('Failed to claim rewards');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400">Please connect your wallet to view your portfolio</p>
        </div>
      </div>
    );
  }

  const displayedAssets = positions;

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="px-4 pt-8 pb-6">
        <h1 className="text-3xl font-bold text-white mb-6">My Wallet</h1>

        {/* Balance Pill */}
        <div className="inline-flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-2 mb-6">
          <DollarSign className="w-4 h-4 text-[#8CFF00]" />
          <span className="text-white font-medium">
            Balance - ${balance?.usdc?.toFixed(2) || '0.00'}
          </span>
        </div>

        {/* Earnings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-2xl p-6 relative overflow-hidden"
        >
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
            <p className="text-gray-400 mb-2">Earning</p>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold text-white">
                ${totalValue.toFixed(4)}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <span className="text-gray-400 text-sm">
                Position in HyperSwap V3
              </span>
            </div>

            {claimableRewards > 0 && (
              <button
                onClick={handleClaim}
                className="w-full bg-[#8CFF00] hover:bg-[#7AE600] text-black font-semibold py-3 rounded-xl transition-colors"
              >
                Claim ${claimableRewards.toFixed(2)}
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Assets Section */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">My Assets</h2>
          <span className="text-[#8CFF00] font-medium">
            {positions.length}
          </span>
        </div>

        <div className="space-y-3">
          {displayedAssets.map((position, index) => (
            <motion.div
              key={position.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-zinc-900 rounded-2xl p-4"
            >
              {/* Main Position Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Protocol Icon */}
                  <div className="w-12 h-12 bg-[#8CFF00] rounded-xl flex items-center justify-center">
                    <Droplets className="w-6 h-6 text-black" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">
                        {position.protocol}
                      </span>
                      <span className="text-xs bg-zinc-800 rounded px-2 py-1 text-gray-400">
                        {position.type}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {position.name}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {position.timestamp}
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className="text-xs text-gray-500">
                        HyperEVM
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href={`${position.explorerUrl}${position.fullTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Token Amounts */}
              <div className="border-t border-zinc-800 pt-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Position</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">HYPE</span>
                        <span className="text-sm text-white font-mono">
                          {position.tokenAmounts.HYPE}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">USDT</span>
                        <span className="text-sm text-white font-mono">
                          {position.tokenAmounts.USDT}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Details</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">NFT</span>
                        <a
                          href={`https://hyperswap.fi/pool/${position.nftId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#8CFF00] hover:underline font-mono flex items-center gap-1"
                        >
                          #{position.nftId}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Gas</span>
                        <span className="text-sm text-gray-500 font-mono">
                          ${position.gasValue}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Hash */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Tx Hash</span>
                <a
                  href={`${position.explorerUrl}${position.fullTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8CFF00] hover:underline font-mono flex items-center gap-1"
                >
                  {position.txHash}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Earn Section Preview */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Earn</h2>
          <button className="text-gray-400 hover:text-white transition-colors">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>

        {/* Add first pool card preview */}
        <div className="bg-zinc-900 rounded-2xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex -space-x-2">
              {['USDT', 'USDC'].map((token, idx) => {
                const logo = TOKEN_LOGOS[token as keyof typeof TOKEN_LOGOS];
                return (
                  <div
                    key={idx}
                    className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-900 overflow-hidden"
                  >
                    {logo && (
                      <Image
                        src={logo}
                        alt={token}
                        width={32}
                        height={32}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <ArrowUp className="w-5 h-5 text-gray-500 rotate-45" />
          </div>

          <h3 className="text-white font-semibold text-lg mb-2">Stablecoin</h3>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            Protect your balance with stablecoins chosen to shield against market swings and always keep your principal secure.
          </p>
        </div>
      </div>
    </div>
  );
}