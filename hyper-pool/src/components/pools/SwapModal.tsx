'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, ArrowDown, Info, AlertCircle } from 'lucide-react'
import { Pool } from '@/types'
import { formatAPY, formatCurrency, cn } from '@/lib/utils/format'
import { useSwap } from '@/lib/hooks/useSwap'
import { formatTokenAmount } from '@/lib/services/hyperbloom-api'
import tokensConfig from '@/config/tokens.json'

interface SwapModalProps {
  pool: Pool
  isOpen: boolean
  onClose: () => void
}

export function SwapModal({ pool, isOpen, onClose }: SwapModalProps) {
  const [amount, setAmount] = useState('1') // Default 1 USDC
  const [ratios, setRatios] = useState([50, 50]) // Default 50/50 split
  const [slippage, setSlippage] = useState(0.5) // 0.5% slippage
  const [approvalType, setApprovalType] = useState<'exact' | 'infinite'>('exact') // Approval type
  const [approvedAmount, setApprovedAmount] = useState<string | null>(null) // Track approved amount

  const {
    quote,
    isLoading,
    isSwapping,
    isApproving,
    needsApproval,
    error,
    getQuote,
    executeSwap,
    approveInputToken,
    approveMaxInputToken,
    clearQuote,
    isConnected,
  } = useSwap()

  // Get quote when amount or ratios change
  useEffect(() => {
    if (amount && parseFloat(amount) > 0 && isOpen) {
      const timer = setTimeout(() => {
        getQuote('usdc-whype-usdt', amount, ratios)
      }, 500) // Debounce

      return () => clearTimeout(timer)
    }
  }, [amount, ratios, isOpen, getQuote])

  // Clear quote on close
  useEffect(() => {
    if (!isOpen) {
      clearQuote()
      setAmount('1')
      setApprovedAmount(null)
      setApprovalType('exact')
    }
  }, [isOpen, clearQuote])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) return

    const result = await executeSwap('usdc-whype-usdt', amount, ratios, slippage)

    if (result?.success) {
      onClose()
      setAmount('1')
      setRatios([50, 50])
    }
  }

  const handleApproveExact = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    const result = await approveInputToken('usdc-whype-usdt', amount)
    if (result) {
      setApprovedAmount(amount)
    }
  }

  const handleApproveInfinite = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    const result = await approveMaxInputToken('usdc-whype-usdt')
    if (result) {
      setApprovedAmount('infinite')
    }
  }

  const poolConfig = tokensConfig.hyperEVM.pools['USDC-WHYPE-USDT']
  const tokens = tokensConfig.hyperEVM.tokens

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg max-h-[calc(100vh-100px)] bg-card rounded-t-3xl sm:rounded-2xl animate-slide-in flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5">
          <div>
            <h3 className="text-xl font-bold mb-2">Swap into Pool</h3>
            <p className="text-sm text-muted">
              Swap USDC into multiple tokens with automatic distribution
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-card-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 pb-32">
          <div className="space-y-4">
          {/* Input Section */}
          <div className="card-base bg-secondary">
            <label className="text-xs text-muted block mb-2">
              You Pay
              {approvalType === 'exact' && approvedAmount && approvedAmount !== 'infinite' && (
                <span className="text-amber-400 ml-2">(🔒 Locked to approved amount)</span>
              )}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  // If using exact approval and amount was approved, lock to approved amount
                  if (approvalType === 'exact' && approvedAmount && approvedAmount !== 'infinite') {
                    return // Don't allow changes when exact amount is approved
                  }
                  setAmount(e.target.value)
                }}
                placeholder="0.00"
                className={cn(
                  "bg-transparent text-2xl font-bold outline-none flex-1",
                  approvalType === 'exact' && approvedAmount && approvedAmount !== 'infinite' && "opacity-60 cursor-not-allowed"
                )}
                readOnly={approvalType === 'exact' && approvedAmount && approvedAmount !== 'infinite'}
              />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card">
                <span className="text-lg">{tokens.USDC.icon}</span>
                <span className="font-medium">USDC</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="p-2 rounded-lg bg-primary/10">
              <ArrowDown className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Output Section */}
          <div className="card-base bg-secondary">
            <label className="text-xs text-muted block mb-3">You Receive</label>

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : quote ? (
              <div className="space-y-3">
                {quote.outputTokens.map((token, index) => {
                  const tokenInfo = tokens[token as keyof typeof tokens]
                  const minAmount = quote.minOutputAmounts[index]

                  return (
                    <div key={token} className="flex items-center justify-between p-3 rounded-lg bg-card">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tokenInfo.icon}</span>
                        <span className="font-medium">{token}</span>
                        <span className="text-xs text-muted">({ratios[index]}%)</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {formatTokenAmount(minAmount, token)}
                        </div>
                        <div className="text-xs text-muted">
                          min. output
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted text-sm">
                Enter amount to see output
              </div>
            )}
          </div>

          {/* Pool Ratio Info */}
          <div className="card-base bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-primary font-medium mb-1">
                  Current Pool Distribution
                </p>
                <p className="text-xs text-muted">
                  This swap uses a {ratios[0]}/{ratios[1]} split between WHYPE and USDT.
                  Future versions will calculate optimal ratios based on pool state.
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          {quote && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Network Fee</span>
                <span>{formatTokenAmount(quote.totalGas, 'HYPE')} HYPE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Price Impact</span>
                <span className={cn(
                  quote.totalPriceImpact > 2 ? 'text-warning' : ''
                )}>
                  {quote.totalPriceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Max Slippage</span>
                <span>{slippage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Number of Transactions</span>
                <span className="text-amber-400">{quote.outputTokens.length}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-muted">You'll receive at least</span>
                <span className="text-primary">
                  {quote.outputTokens.map((token, i) =>
                    `${formatTokenAmount(quote.minOutputAmounts[i], token)} ${token}`
                  ).join(' + ')}
                </span>
              </div>

              {/* Warning about multiple transactions */}
              {quote.outputTokens.length > 1 && (
                <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-500">
                    ⚠️ This swap requires {quote.outputTokens.length} separate transactions.
                    You'll need to approve each one in your wallet.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
              <p className="text-xs text-red-500">{error}</p>
            </div>
          )}

          {/* Approval and Swap Buttons */}
          {!isConnected ? (
            <p className="text-center text-muted text-sm">
              Please connect your wallet to swap
            </p>
          ) : needsApproval ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-500 mb-2">
                  Choose how to approve USDC spending:
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setApprovalType('exact')}
                    className={cn(
                      'flex-1 p-2 rounded-lg text-xs transition-colors',
                      approvalType === 'exact'
                        ? 'bg-primary text-black font-medium'
                        : 'bg-card hover:bg-card-hover'
                    )}
                  >
                    Exact Amount ({amount} USDC)
                  </button>
                  <button
                    onClick={() => setApprovalType('infinite')}
                    className={cn(
                      'flex-1 p-2 rounded-lg text-xs transition-colors',
                      approvalType === 'infinite'
                        ? 'bg-primary text-black font-medium'
                        : 'bg-card hover:bg-card-hover'
                    )}
                  >
                    Infinite Approval
                  </button>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-400">
                  ℹ️ {approvalType === 'exact'
                    ? `You'll approve exactly ${amount} USDC. The swap amount will be locked to this value.`
                    : `You'll approve unlimited USDC spending. You can swap any amount without re-approving.`
                  }
                </p>
              </div>

              <button
                onClick={approvalType === 'exact' ? handleApproveExact : handleApproveInfinite}
                disabled={!amount || isApproving || isLoading}
                className={cn(
                  'btn-primary w-full',
                  (!amount || isApproving || isLoading) &&
                    'opacity-50 cursor-not-allowed'
                )}
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Approving...
                  </>
                ) : (
                  `Approve ${approvalType === 'exact' ? amount + ' ' : 'Unlimited '}USDC`
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleSwap}
              disabled={!amount || isSwapping || isLoading || !!error}
              className={cn(
                'btn-primary w-full',
                (!amount || isSwapping || isLoading || !!error) &&
                  'opacity-50 cursor-not-allowed'
              )}
            >
              {isSwapping ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                  Swapping...
                </>
              ) : (
                'Swap USDC'
              )}
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}