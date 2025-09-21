'use client'

import { Pool } from '@/types'
import { formatAPY, formatCurrency, cn } from '@/lib/utils/format'
import { TrendingUp, Shield, Zap } from 'lucide-react'

interface PoolCardProps {
  pool: Pool
  onSelect: (pool: Pool) => void
}

const riskIcons = {
  low: Shield,
  medium: Zap,
  high: TrendingUp,
}

const riskColors = {
  low: 'text-green-500',
  medium: 'text-yellow-500',
  high: 'text-red-500',
}

export function PoolCard({ pool, onSelect }: PoolCardProps) {
  const RiskIcon = riskIcons[pool.risk]

  return (
    <button
      onClick={() => onSelect(pool)}
      className={cn(
        'w-full text-left',
        'card-base card-hover',
        'transform transition-all duration-200',
        'active:scale-[0.98]'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{pool.icon}</span>
          <div>
            <h3 className="font-semibold text-lg">{pool.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <RiskIcon className={cn('w-4 h-4', riskColors[pool.risk])} />
              <span className="text-xs text-muted capitalize">
                {pool.risk} Risk
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{formatAPY(pool.apy)}</p>
          <p className="text-xs text-muted">APY</p>
        </div>
      </div>

      <p className="text-sm text-muted mb-4">{pool.description}</p>

      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div>
          <p className="text-xs text-muted">TVL</p>
          <p className="text-sm font-medium">{formatCurrency(pool.tvl)}</p>
        </div>
        <div className="text-right">
          {pool.id === 'usdc-hype-usdt' ? (
            <>
              <p className="text-xs text-muted">Action</p>
              <p className="text-sm font-medium text-primary">Swap →</p>
            </>
          ) : parseFloat(pool.userInvested) > 0 ? (
            <>
              <p className="text-xs text-muted">Your Investment</p>
              <p className="text-sm font-medium text-primary">
                {formatCurrency(pool.userInvested)}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted">Min. Amount</p>
              <p className="text-sm font-medium">$1.00</p>
            </>
          )}
        </div>
      </div>
    </button>
  )
}