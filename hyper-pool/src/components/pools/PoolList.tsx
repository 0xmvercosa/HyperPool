'use client'

import { useState } from 'react'
import { Pool } from '@/types'
import { PoolCard } from './PoolCard'
import { SwapModal } from './SwapModal'
import { MOCK_DATA } from '@/lib/constants'

export function PoolList() {
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Available Pools</h2>
          <span className="text-xs text-muted">
            {MOCK_DATA.pools.length} Pools
          </span>
        </div>

        <div className="grid gap-4">
          {MOCK_DATA.pools.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              onSelect={setSelectedPool}
            />
          ))}
        </div>
      </div>

      {selectedPool && (
        <SwapModal
          pool={selectedPool}
          isOpen={!!selectedPool}
          onClose={() => setSelectedPool(null)}
        />
      )}
    </>
  )
}