'use client'

import { useAccount, useChainId } from 'wagmi'
import { useWalletBalances } from '@/lib/hooks/useTokenBalance'
import { HYPEREVM_TOKENS } from '@/lib/config/chains'

export function NetworkDebug() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { usdcBalance, hypeBalance, isLoading } = useWalletBalances()

  if (!isConnected) return null

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-20 left-4 z-50 p-3 bg-black/90 rounded-lg text-xs font-mono text-green-400 max-w-sm">
      <div className="space-y-1">
        <div>Chain ID: {chainId} {chainId === 999 ? '✅' : '❌'}</div>
        <div>Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}</div>
        <div>USDC Contract: {HYPEREVM_TOKENS.USDC.address.slice(0, 10)}...</div>
        <div>USDC Balance: {isLoading ? 'Loading...' : usdcBalance}</div>
        <div>HYPE Balance: {isLoading ? 'Loading...' : hypeBalance}</div>
      </div>
    </div>
  )
}