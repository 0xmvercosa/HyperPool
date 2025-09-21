'use client'

import { useWallet } from '@/lib/hooks/useWallet'
import { formatCurrency, formatAPY } from '@/lib/utils/format'
import { TrendingUp, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { MOCK_DATA } from '@/lib/constants'

export function EarningPool() {
  const { isConnected } = useWallet()
  const [isClaiming, setIsClaiming] = useState(false)
  const [earnings, setEarnings] = useState(MOCK_DATA.earningPool)
  const [pendingRewards, setPendingRewards] = useState(MOCK_DATA.pendingRewards)

  // Simulate earnings growth
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      setPendingRewards(prev => {
        const newReward = parseFloat(prev) + 0.01
        return newReward.toFixed(2)
      })
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [isConnected])

  if (!isConnected) {
    return null
  }

  const handleClaim = async () => {
    setIsClaiming(true)
    try {
      // Simulate claiming rewards
      await new Promise(resolve => setTimeout(resolve, 2000))
      setEarnings(prev => (parseFloat(prev) + parseFloat(pendingRewards)).toFixed(2))
      setPendingRewards('0')
    } finally {
      setIsClaiming(false)
    }
  }

  const hasRewards = parseFloat(pendingRewards) > 0

  return (
    <div className="card-base bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-muted mb-1">Earning Pool</p>
          <p className="text-3xl font-bold">{formatCurrency(earnings)}</p>
          <div className="flex items-center gap-2 mt-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              {formatAPY(MOCK_DATA.apy)} APY
            </span>
          </div>
        </div>
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
      </div>

      {hasRewards && (
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted">Pending Rewards</p>
              <p className="text-lg font-semibold text-primary">
                +{formatCurrency(pendingRewards)}
              </p>
            </div>
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="btn-primary px-4 py-2 text-sm"
            >
              {isClaiming ? 'Claiming...' : 'Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}