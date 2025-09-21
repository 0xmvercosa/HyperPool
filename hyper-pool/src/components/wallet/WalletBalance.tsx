'use client'

import { useWallet } from '@/lib/hooks/useWallet'
import { useWalletBalances } from '@/lib/hooks/useTokenBalance'
import { formatCurrency } from '@/lib/utils/format'
import { DollarSign, RefreshCw, Fuel } from 'lucide-react'
import { useState } from 'react'

export function WalletBalance() {
  const { isConnected } = useWallet()
  const { usdcBalance, hypeBalance, isLoading, refetchBalances } = useWalletBalances()
  const [isRefreshing, setIsRefreshing] = useState(false)

  if (!isConnected) {
    return null
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetchBalances()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Use real balances (no mock data)
  const displayUsdcBalance = usdcBalance || '0'
  const displayHypeBalance = hypeBalance || '0'

  // Debug logging
  console.log('USDC Balance:', usdcBalance)
  console.log('HYPE Balance:', hypeBalance)
  console.log('Is Loading:', isLoading)

  return (
    <div className="card-base">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted">Available Balance</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                {isLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  <>
                    ${parseFloat(displayUsdcBalance).toFixed(2)}
                    <span className="text-xs font-normal text-muted ml-1">USDC</span>
                  </>
                )}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted">
                <span>(</span>
                <Fuel className="w-3 h-3" />
                <span>{parseFloat(displayHypeBalance).toFixed(3)} HYPE</span>
                <span>)</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg hover:bg-card-hover transition-colors"
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 text-muted ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}