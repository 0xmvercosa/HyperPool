'use client'

import { useState } from 'react'
import { useTokenApproval } from '@/lib/hooks/useTokenApproval'
import { useWallet } from '@/lib/hooks/useWallet'
import { formatUnits } from 'viem'
import { Loader2 } from 'lucide-react'

export function ApprovalDebugger() {
  const { isConnected } = useWallet()
  const {
    checkAllowance,
    approveToken,
    approveMax,
    needsApproval,
    isApproving,
    HYPERBLOOM_ROUTER
  } = useTokenApproval()

  const [currentAllowance, setCurrentAllowance] = useState<string>('')
  const [checkingToken, setCheckingToken] = useState<string>('')

  const handleCheckAllowance = async (token: string) => {
    setCheckingToken(token)
    try {
      const allowance = await checkAllowance(token)
      const decimals = token === 'USDC' || token === 'USDT' ? 6 : 18
      setCurrentAllowance(`${token}: ${formatUnits(allowance, decimals)}`)
    } catch (error) {
      setCurrentAllowance(`${token}: Error checking`)
    } finally {
      setCheckingToken('')
    }
  }

  const handleApprove = async (token: string, amount: string) => {
    const result = await approveToken(token, amount)
    if (result) {
      await handleCheckAllowance(token)
    }
  }

  const handleApproveMax = async (token: string) => {
    const result = await approveMax(token)
    if (result) {
      await handleCheckAllowance(token)
    }
  }

  if (!isConnected) {
    return (
      <div className="card-base p-4">
        <p className="text-muted">Connect wallet to test approvals</p>
      </div>
    )
  }

  return (
    <div className="card-base p-4 space-y-4">
      <h3 className="font-semibold">Token Approval Debugger</h3>

      <div className="text-xs text-muted">
        <p>Router Address: {HYPERBLOOM_ROUTER}</p>
        {currentAllowance && <p>Current Allowance: {currentAllowance}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => handleCheckAllowance('USDC')}
            disabled={checkingToken === 'USDC'}
            className="btn-secondary text-xs px-3 py-1"
          >
            {checkingToken === 'USDC' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              'Check USDC'
            )}
          </button>
          <button
            onClick={() => handleApprove('USDC', '1')}
            disabled={isApproving}
            className="btn-secondary text-xs px-3 py-1"
          >
            Approve 1 USDC
          </button>
          <button
            onClick={() => handleApproveMax('USDC')}
            disabled={isApproving}
            className="btn-secondary text-xs px-3 py-1"
          >
            Approve Max
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleCheckAllowance('WHYPE')}
            disabled={checkingToken === 'WHYPE'}
            className="btn-secondary text-xs px-3 py-1"
          >
            {checkingToken === 'WHYPE' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              'Check WHYPE'
            )}
          </button>
          <button
            onClick={() => handleApprove('WHYPE', '1')}
            disabled={isApproving}
            className="btn-secondary text-xs px-3 py-1"
          >
            Approve 1 WHYPE
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleCheckAllowance('USDT')}
            disabled={checkingToken === 'USDT'}
            className="btn-secondary text-xs px-3 py-1"
          >
            {checkingToken === 'USDT' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              'Check USDT'
            )}
          </button>
          <button
            onClick={() => handleApprove('USDT', '1')}
            disabled={isApproving}
            className="btn-secondary text-xs px-3 py-1"
          >
            Approve 1 USDT
          </button>
        </div>
      </div>

      {isApproving && (
        <div className="flex items-center gap-2 text-xs text-primary">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Approving token...</span>
        </div>
      )}
    </div>
  )
}