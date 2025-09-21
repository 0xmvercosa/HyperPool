'use client'

import { PoolList } from '@/components/pools/PoolList'
import { formatCurrency, formatAPY } from '@/lib/utils/format'
import { MOCK_DATA } from '@/lib/constants'
import { useStore } from '@/lib/store/useStore'

export default function EarnPage() {
  const { isConnected, balance, earnings } = useStore()

  const totalTVL = MOCK_DATA.pools.reduce((sum, pool) => sum + pool.tvl, 0)
  const avgAPY = MOCK_DATA.pools.reduce((sum, pool) => sum + pool.apy, 0) / MOCK_DATA.pools.length

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-b from-primary/10 to-transparent border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Earn</h1>
          <p className="text-sm text-muted">
            Stake your USDHL and earn passive income
          </p>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="card-base">
              <p className="text-xs text-muted mb-1">Total Value Locked</p>
              <p className="text-xl font-bold">{formatCurrency(totalTVL)}</p>
            </div>
            <div className="card-base">
              <p className="text-xs text-muted mb-1">Average APY</p>
              <p className="text-xl font-bold text-primary">{formatAPY(avgAPY)}</p>
            </div>
          </div>

          {isConnected && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="card-base bg-secondary">
                <p className="text-xs text-muted mb-1">Your Balance</p>
                <p className="text-lg font-semibold">{formatCurrency(balance)}</p>
              </div>
              <div className="card-base bg-secondary">
                <p className="text-xs text-muted mb-1">Your Earnings</p>
                <p className="text-lg font-semibold text-primary">
                  {formatCurrency(earnings)}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6">
        <PoolList />
      </main>
    </div>
  )
}