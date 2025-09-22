'use client'

import { WalletConnect } from '@/components/wallet/WalletConnect'
import { WalletDisplay } from '@/components/wallet/WalletDisplay'
import { useWallet } from '@/lib/hooks/useWallet'
import { useInvestments } from '@/lib/hooks/useInvestments'
import { EarningsCard } from '@/components/home/EarningsCard'
import { PoolCard } from '@/components/home/PoolCard'
import { EarnModal } from '@/components/modals/EarnModal'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const pools = [
  {
    id: 'hype-usdt',
    name: 'HYPE/USDT',
    description: 'High yield HYPE and USDT liquidity provision on HyperSwap V3.',
    apy: 106.64,
    risk: 'high' as const,
    tokens: [
      { symbol: 'HYPE' },
      { symbol: 'USDT' }
    ],
    tagline: 'Hot APR 🔥',
    tvl: '$3.9M',
    volume24h: '$271.36K'
  },
  {
    id: 'hype-ubtc',
    name: 'HYPE/UBTC',
    description: 'High yield opportunity with HYPE and Bitcoin pair on HyperSwap V3.',
    apy: 93.82,
    risk: 'high' as const,
    tokens: [
      { symbol: 'HYPE' },
      { symbol: 'BTC' }
    ],
    tagline: 'High APR',
    tvl: '$7.9M',
    volume24h: '$78.99'
  },
  {
    id: 'ubtc-usdt',
    name: 'UBTC/USDT',
    description: 'Stable Bitcoin exposure with USDT pairing for reduced volatility.',
    apy: 3.79,
    risk: 'low' as const,
    tokens: [
      { symbol: 'BTC' },
      { symbol: 'USDT' }
    ],
    tagline: 'Best APR',
    tvl: '$14.8M',
    volume24h: '$44.52'
  }
];

export default function Home() {
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Load test function in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@/lib/utils/testTokens').then(module => {
        if (typeof window !== 'undefined') {
          (window as any).testTokens = module.testTokenSupport
          console.log('Test function available: window.testTokens()')
        }
      })
    }
  }, [])

  const { isConnected } = useWallet()
  const { totalInvested, totalEarnings, availableFees, collectFees } = useInvestments()

  // Show connect modal when not connected
  useEffect(() => {
    if (!isConnected) {
      setShowConnectModal(true);
    } else {
      setShowConnectModal(false);
    }
  }, [isConnected])

  const handlePoolClick = (pool: typeof pools[0]) => {
    setSelectedPoolId(pool.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedPoolId(null), 300); // Clear after animation
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/assets/images/logoHyperPool.svg"
                alt="HyperPool"
                className="h-8 w-auto"
              />
            </div>
            {isConnected ? <WalletDisplay /> : <WalletConnect />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        {/* Earnings Card */}
        {isConnected && (
          <div className="mb-6">
            <EarningsCard
              totalEarnings={totalEarnings}
              dailyChange={totalEarnings * 0.01} // Mock 1% daily change
              percentageChange={totalInvested > 0 ? (totalEarnings / totalInvested) * 100 : 0}
              investedBalance={totalInvested}
              availableFees={availableFees}
              onCollectFees={collectFees}
            />
          </div>
        )}

        {/* Section Title */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Earn</h2>
          <button className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Pool Cards */}
        <div className="space-y-4">
          {pools.map((pool, index) => (
            <PoolCard
              key={pool.id}
              {...pool}
              index={index}
              onClick={() => handlePoolClick(pool)}
            />
          ))}
        </div>

        {/* Connect Wallet Prompt - when not connected */}
        {showConnectModal && !isConnected && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <div className="bg-zinc-900 rounded-2xl p-8 max-w-sm w-full text-center relative">
              {/* Close button */}
              <button
                onClick={() => setShowConnectModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-4">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-[#8CFF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
              <p className="text-gray-400 text-sm mb-6">
                Connect your wallet to start earning with HyperPool
              </p>
              <WalletConnect />
            </div>
          </div>
        )}
      </main>

      {/* Earn Modal */}
      <EarnModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        poolId={selectedPoolId}
      />
    </div>
  )
}