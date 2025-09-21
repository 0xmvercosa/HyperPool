'use client'

import { WalletConnect } from '@/components/wallet/WalletConnect'
import { WalletBalance } from '@/components/wallet/WalletBalance'
import { EarningPool } from '@/components/wallet/EarningPool'
import { PoolList } from '@/components/pools/PoolList'
import { useWallet } from '@/lib/hooks/useWallet'
import { SwapDebugger } from '@/components/debug/SwapDebugger'
import { ApprovalDebugger } from '@/components/debug/ApprovalDebugger'
import { useEffect } from 'react'

export default function Home() {
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold gradient-text">Hyper Pool</h1>
              <p className="text-xs text-muted">Simple DeFi Earnings</p>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Wallet Section */}
        {isConnected ? (
          <>
            <WalletBalance />
            <EarningPool />
          </>
        ) : (
          <div className="card-base text-center py-12">
            <div className="mb-4">
              <span className="text-6xl">🔐</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-sm text-muted mb-6">
              Connect your wallet to start earning with Hyper Pool
            </p>
            <WalletConnect />
          </div>
        )}

        {/* Pool List */}
        <PoolList />

        {/* Debug Section - Only in development */}
        {process.env.NODE_ENV === 'development' && isConnected && (
          <div className="space-y-4">
            <ApprovalDebugger />
            <SwapDebugger />
          </div>
        )}
      </main>
    </div>
  )
}
