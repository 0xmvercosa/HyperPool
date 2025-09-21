'use client'

import { useStore } from '@/lib/store/useStore'
import { MOCK_DATA } from '@/lib/constants'
import { formatCurrency, formatAPY, cn } from '@/lib/utils/format'
import { TrendingUp, Wallet, PieChart } from 'lucide-react'

export default function PortfolioPage() {
  const { isConnected, balance, earnings, pendingRewards } = useStore()

  const stakedPools = MOCK_DATA.pools.filter(pool => parseFloat(pool.userStaked) > 0)
  const totalStaked = stakedPools.reduce((sum, pool) => sum + parseFloat(pool.userStaked), 0)
  const totalValue = totalStaked + parseFloat(balance) + parseFloat(earnings)

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-6xl block mb-4">📊</span>
          <h2 className="text-xl font-semibold mb-2">No Portfolio Yet</h2>
          <p className="text-sm text-muted">
            Connect your wallet to view your portfolio
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-b from-primary/10 to-transparent border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
          <div className="card-base glassmorphism mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted mb-1">Total Portfolio Value</p>
                <p className="text-3xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <PieChart className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
              <div>
                <p className="text-xs text-muted mb-1">Available</p>
                <p className="text-sm font-semibold">{formatCurrency(balance)}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Staked</p>
                <p className="text-sm font-semibold">{formatCurrency(totalStaked)}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Earnings</p>
                <p className="text-sm font-semibold text-primary">
                  +{formatCurrency(earnings)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Active Positions */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Active Positions</h2>
          {stakedPools.length > 0 ? (
            <div className="space-y-3">
              {stakedPools.map(pool => (
                <div key={pool.id} className="card-base">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{pool.icon}</span>
                      <div>
                        <p className="font-medium">{pool.name}</p>
                        <p className="text-xs text-muted">{formatAPY(pool.apy)} APY</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(pool.userStaked)}</p>
                      <p className="text-xs text-primary">
                        +{formatCurrency((parseFloat(pool.userStaked) * pool.apy) / 365 / 100)}/day
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-base text-center py-8">
              <Wallet className="w-12 h-12 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">No active positions</p>
            </div>
          )}
        </section>

        {/* Pending Rewards */}
        {parseFloat(pendingRewards) > 0 && (
          <section className="card-base bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted mb-1">Pending Rewards</p>
                <p className="text-xl font-bold text-primary">
                  +{formatCurrency(pendingRewards)}
                </p>
              </div>
              <button className="btn-primary px-4 py-2 text-sm">
                Claim All
              </button>
            </div>
          </section>
        )}

        {/* Performance */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Performance</h2>
          <div className="card-base">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm text-primary font-medium">+12.5% This Month</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-muted">Daily Earnings</span>
                <span className="text-sm font-medium text-primary">
                  +{formatCurrency((totalStaked * 13) / 365 / 100)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted">Weekly Earnings</span>
                <span className="text-sm font-medium text-primary">
                  +{formatCurrency((totalStaked * 13 * 7) / 365 / 100)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted">Monthly Earnings</span>
                <span className="text-sm font-medium text-primary">
                  +{formatCurrency((totalStaked * 13 * 30) / 365 / 100)}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}