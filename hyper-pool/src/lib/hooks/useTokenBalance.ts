'use client'

import { useAccount, useBalance, useReadContract, useChainId } from 'wagmi'
import { formatUnits } from 'viem'
import { HYPEREVM_TOKENS } from '@/lib/config/chains'

// Standard ERC20 ABI for balanceOf function
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'uint8' }],
  },
] as const

export function useTokenBalance(tokenSymbol: 'USDC' | 'HYPE' | 'USDT') {
  const { address, chainId } = useAccount()
  const token = HYPEREVM_TOKENS[tokenSymbol]

  // Debug logging
  console.log(`[useTokenBalance] Token: ${tokenSymbol}`, {
    address,
    chainId,
    tokenAddress: token.address,
  })

  // For native token (HYPE), use useBalance hook
  const { data: nativeBalance, isLoading: nativeLoading, refetch: refetchNative, error: nativeError } = useBalance({
    address: address as `0x${string}` | undefined,
    query: {
      enabled: !!address && tokenSymbol === 'HYPE',
    },
  })

  // For ERC20 tokens (USDC, USDT), use useReadContract
  const { data: tokenBalance, isLoading: tokenLoading, refetch: refetchToken, error: tokenError } = useReadContract({
    address: token.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && tokenSymbol !== 'HYPE' && chainId === 999, // Only on HyperEVM
    },
  })

  // Log errors
  if (nativeError) console.error(`[useTokenBalance] Native balance error:`, nativeError)
  if (tokenError) console.error(`[useTokenBalance] Token balance error:`, tokenError)

  // Format the balance based on token type
  const formattedBalance = (() => {
    if (tokenSymbol === 'HYPE' && nativeBalance) {
      const formatted = formatUnits(nativeBalance.value, 18)
      console.log(`[useTokenBalance] HYPE balance: ${formatted}`)
      return formatted
    }
    if (tokenSymbol !== 'HYPE' && tokenBalance) {
      const formatted = formatUnits(tokenBalance as bigint, token.decimals)
      console.log(`[useTokenBalance] ${tokenSymbol} balance: ${formatted}`)
      return formatted
    }
    return '0'
  })()

  return {
    balance: formattedBalance,
    rawBalance: tokenSymbol === 'HYPE' ? nativeBalance?.value : (tokenBalance as bigint | undefined),
    isLoading: tokenSymbol === 'HYPE' ? nativeLoading : tokenLoading,
    refetch: tokenSymbol === 'HYPE' ? refetchNative : refetchToken,
    symbol: token.symbol,
    decimals: token.decimals,
  }
}

// Hook to get both USDC and native token (HYPE) balances
export function useWalletBalances() {
  const { address } = useAccount()

  // Get USDC balance
  const {
    balance: usdcBalance,
    isLoading: usdcLoading,
    refetch: refetchUsdc,
  } = useTokenBalance('USDC')

  // Get native HYPE balance for gas
  const {
    balance: hypeBalance,
    isLoading: hypeLoading,
    refetch: refetchHype,
  } = useTokenBalance('HYPE')

  const refetchAll = async () => {
    await Promise.all([refetchUsdc(), refetchHype()])
  }

  return {
    usdcBalance,
    hypeBalance,
    isLoading: usdcLoading || hypeLoading,
    refetchBalances: refetchAll,
    hasGas: parseFloat(hypeBalance) > 0.001, // Minimum gas threshold
  }
}