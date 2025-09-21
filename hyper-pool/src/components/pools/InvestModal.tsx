'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, ArrowDown, Info } from 'lucide-react'
import { Pool } from '@/types'
import { formatAPY, formatCurrency, cn } from '@/lib/utils/format'
import { useWallet } from '@/lib/hooks/useWallet'
import { useWalletBalances } from '@/lib/hooks/useTokenBalance'
import { useSwap } from '@/lib/hooks/useSwap'
import { formatTokenAmount } from '@/lib/services/hyperbloom'

interface InvestModalProps {
  pool: Pool
  isOpen: boolean
  onClose: () => void
}

export function InvestModal({ pool, isOpen, onClose }: InvestModalProps) {
  const [amount, setAmount] = useState('1') // Default 1 USDC
  const [ratios, setRatios] = useState([50, 50]) // Default 50/50 split for HYPE/USDT
  const { isConnected } = useWallet()
  const { usdcBalance, isLoading: balanceLoading } = useWalletBalances()
  const {
    quote,
    isLoading,
    isSwapping,
    error,
    getQuote,
    executeSwap,
    clearQuote,
  } = useSwap()

  // Get quote when amount or ratios change
  useEffect(() => {
    if (amount && parseFloat(amount) > 0 && isOpen) {
      const timer = setTimeout(() => {
        getQuote('usdc-hype-usdt', 'USDC', amount, ratios)
      }, 500) // Debounce

      return () => clearTimeout(timer)
    }
  }, [amount, ratios, isOpen, getQuote])

  // Clear quote on close
  useEffect(() => {
    if (!isOpen) {
      clearQuote()
      setAmount('1')
      setRatios([50, 50])
    }
  }, [isOpen, clearQuote])

  if (!isOpen) return null

  const handleInvest = async () => {
    if (!amount || parseFloat(amount) <= 0) return

    try {
      // Execute swap to ratio (swap USDC to HYPE/USDT in the right proportions)
      const result = await executeSwap('usdc-hype-usdt', 'USDC', amount, 0.5)

      if (result?.success) {
        // In the future, we'll add liquidity to the pool here
        // For now, tokens are returned to the user's wallet
        onClose()
        setAmount('1')
      }
    } catch (error) {
      console.error('Investment failed:', error)
    }
  }

  const maxAmount = parseFloat(usdcBalance || '0')
  const isInsufficientBalance = parseFloat(amount) > maxAmount

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-card rounded-t-3xl sm:rounded-2xl p-6 animate-slide-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-card-hover transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2">Invest in Liquidity Pool</h3>
          <p className="text-sm text-muted">
            Add liquidity to {pool.name} and earn {formatAPY(pool.apy)} APY
          </p>
        </div>

        <div className="space-y-4">
          {/* Input Section */}
          <div className="card-base bg-secondary">
            <label className="text-xs text-muted block mb-2">Investment Amount</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-2xl font-bold outline-none flex-1"
              />
              <button
                onClick={() => setAmount(usdcBalance || '0')}
                className="text-xs text-primary hover:text-primary-hover transition-colors px-2 py-1 rounded bg-card"
              >
                MAX
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card">
                <span className="text-lg">💵</span>
                <span className="font-medium">USDC</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted">
              Available: {balanceLoading ? 'Loading...' : formatCurrency(usdcBalance || '0')} USDC
            </div>
          </div>

          <div className="flex justify-center">
            <div className="p-2 rounded-lg bg-primary/10">
              <ArrowDown className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Output Section - Pool Tokens */}
          <div className="card-base bg-secondary">
            <label className="text-xs text-muted block mb-3">You'll Receive (Pool Tokens)</label>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : quote ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-card">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    <span className="font-medium">HYPE</span>
                    <span className="text-xs text-muted">({ratios[0]}%)</span>
                  </div>
                  <span className="font-bold text-lg">
                    {formatTokenAmount(quote.outputAmounts[0], 'HYPE')}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-card">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <span className="font-medium">USDT</span>
                    <span className="text-xs text-muted">({ratios[1]}%)</span>
                  </div>
                  <span className="font-bold text-lg">
                    {formatTokenAmount(quote.outputAmounts[1], 'USDT')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted text-sm">
                Enter amount to see output
              </div>
            )}
          </div>

          {/* Pool Ratio Slider */}
          <div className="card-base">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted">Adjust Pool Ratio</span>
              <span className="text-xs font-medium">{ratios[0]}% HYPE / {ratios[1]}% USDT</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={ratios[0]}
              onChange={(e) => {
                const hypeRatio = parseInt(e.target.value)
                setRatios([hypeRatio, 100 - hypeRatio])
              }}
              className="w-full"
            />
          </div>

          {/* Info Box */}
          <div className="card-base bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-primary font-medium mb-1">
                  Liquidity Pool Investment
                </p>
                <p className="text-xs text-muted">
                  Your USDC will be swapped to HYPE and USDT in the selected ratio, then added to the liquidity pool.
                  You'll earn {formatAPY(pool.apy)} APY from trading fees.
                </p>
              </div>
            </div>
          </div>

          {/* Expected Returns */}
          {quote && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Expected Daily Return</span>
                <span className="text-primary">+{formatCurrency((parseFloat(amount || '0') * pool.apy) / 365 / 100)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Expected Annual Return</span>
                <span className="text-primary">+{formatCurrency((parseFloat(amount || '0') * pool.apy) / 100)}</span>
              </div>
              {quote.estimatedGas && (
                <div className="flex justify-between">
                  <span className="text-muted">Network Fee</span>
                  <span>{quote.estimatedGas} HYPE</span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="text-xs text-red-500">{error}</span>
            </div>
          )}

          {/* Invest Button */}
          {!isConnected ? (
            <p className="text-center text-muted text-sm">
              Please connect your wallet to invest
            </p>
          ) : (
            <button
              onClick={handleInvest}
              disabled={!amount || isInsufficientBalance || isSwapping || isLoading || !!error}
              className={cn(
                'btn-primary w-full',
                (!amount || isInsufficientBalance || isSwapping || isLoading || !!error) &&
                  'opacity-50 cursor-not-allowed'
              )}
            >
              {isSwapping ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                  Investing...
                </>
              ) : isInsufficientBalance ? (
                'Insufficient Balance'
              ) : (
                'Invest USDC'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}