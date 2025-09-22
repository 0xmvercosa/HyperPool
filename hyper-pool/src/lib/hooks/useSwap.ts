'use client'

import { useState, useCallback } from 'react'
import { useWallet } from './useWallet'
import { useHyperEVM } from './useHyperEVM'
import { useTokenApproval } from './useTokenApproval'
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { hyperbloomAPI, PoolSwapQuote, formatTokenAmount } from '@/lib/services/hyperbloom-api'
import { toast } from '@/lib/utils/toast'
import tokensConfig from '@/config/tokens.json'
import { combineSwapQuotes } from '@/lib/utils/multicall'
import { formatTransactionForWallet } from '@/lib/utils/transaction-decoder'
import { safeBigInt, safeNumber } from '@/lib/utils/safe-bigint'

export interface SwapState {
  isLoading: boolean
  isSwapping: boolean
  isApproving: boolean
  needsApproval: boolean
  quote: PoolSwapQuote | null
  error: string | null
  txHash: string | null
}

export function useSwap() {
  const { isConnected, address, activeWallet } = useWallet()
  const { ensureHyperEVM } = useHyperEVM()
  const { approveToken, approveMax, needsApproval, isApproving: isApprovingToken } = useTokenApproval()

  const { sendTransactionAsync } = useSendTransaction()

  const [state, setState] = useState<SwapState>({
    isLoading: false,
    isSwapping: false,
    isApproving: false,
    needsApproval: false,
    quote: null,
    error: null,
    txHash: null,
  })

  // Get swap quote for pool
  const getQuote = useCallback(async (
    poolId: string,
    inputAmount: string,
    ratios?: number[]
  ) => {
    if (!isConnected || !address) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }))
      return null
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const quote = await hyperbloomAPI.getPoolSwapQuote(
        poolId,
        inputAmount,
        ratios,
        0.005, // 0.5% slippage
        address
      )

      // Check if approval is needed for the input token
      const poolKey = poolId.toUpperCase().replace(/-/g, '-')
      const poolConfig = tokensConfig.hyperEVM.pools[poolKey as keyof typeof tokensConfig.hyperEVM.pools] ||
                         Object.values(tokensConfig.hyperEVM.pools).find(p => p.id === poolId)
      const inputTokenSymbol = poolConfig?.inputToken || 'USDC'

      // Log for debugging
      console.log('[useSwap] Checking approval for:', {
        poolId,
        inputTokenSymbol,
        inputAmount
      })

      const requiresApproval = await needsApproval(inputTokenSymbol, inputAmount)

      console.log('[useSwap] Approval needed:', requiresApproval)

      setState(prev => ({ ...prev, quote, isLoading: false, needsApproval: requiresApproval }))
      return quote
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get quote'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }))
      console.error('Quote error:', error)
      return null
    }
  }, [isConnected, address])

  // Execute swap on blockchain
  const executeSwap = useCallback(async (
    poolId: string,
    inputAmount: string,
    ratios?: number[],
    slippage: number = 0.5
  ) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return null
    }

    // Ensure we're on the right network
    const isOnHyperEVM = await ensureHyperEVM()
    if (!isOnHyperEVM) return null

    // Validate swap parameters
    const amount = parseFloat(inputAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid input amount')
      return null
    }

    setState(prev => ({ ...prev, isSwapping: true, error: null }))

    try {
      // Check and handle token approval first
      const poolKey = poolId.toUpperCase().replace(/-/g, '-')
      const poolConfig = tokensConfig.hyperEVM.pools[poolKey as keyof typeof tokensConfig.hyperEVM.pools] ||
                         Object.values(tokensConfig.hyperEVM.pools).find(p => p.id === poolId)
      const inputTokenSymbol = poolConfig?.inputToken || 'USDC'

      console.log('[executeSwap] Checking approval for swap:', {
        poolId,
        inputTokenSymbol,
        inputAmount,
        userAddress: address
      })

      const requiresApproval = await needsApproval(inputTokenSymbol, inputAmount)

      console.log('[executeSwap] Approval check result:', {
        requiresApproval,
        tokenSymbol: inputTokenSymbol,
        amount: inputAmount
      })

      if (requiresApproval) {
        console.log('[executeSwap] Token approval needed, requesting approval...')
        setState(prev => ({ ...prev, isApproving: true }))
        toast.info('Approving token spending...')

        const approved = await approveToken(inputTokenSymbol, inputAmount)
        setState(prev => ({ ...prev, isApproving: false }))

        console.log('[executeSwap] Approval attempt result:', approved)

        if (!approved) {
          setState(prev => ({
            ...prev,
            error: 'Token approval failed',
            isSwapping: false
          }))
          toast.error('Please approve token spending to continue')
          return null
        }

        // Re-check allowance after approval
        const stillNeedsApproval = await needsApproval(inputTokenSymbol, inputAmount)
        console.log('[executeSwap] Re-check after approval:', {
          stillNeedsApproval,
          message: stillNeedsApproval ? 'Still needs approval!' : 'Approval successful'
        })

        if (stillNeedsApproval) {
          console.error('[executeSwap] Approval failed - still insufficient allowance')
          toast.error('Insufficient token allowance. Please approve token spending first.')
          setState(prev => ({
            ...prev,
            error: 'Insufficient allowance after approval',
            isSwapping: false
          }))
          return null
        }
      }

      // Get executable quotes for each swap
      console.log('[executeSwap] Getting pool swap transactions...')
      const swapQuotes = await hyperbloomAPI.getPoolSwapTransactions(
        poolId,
        inputAmount,
        address,
        ratios,
        slippage / 100 // Convert percentage to decimal
      )

      console.log('[executeSwap] Swap quotes received:', {
        count: swapQuotes.length,
        quotes: swapQuotes.map(q => ({
          to: q.to,
          allowanceTarget: q.allowanceTarget,
          value: q.value,
          sellAmount: q.sellAmount,
          buyAmount: q.buyAmount
        }))
      })

      // Check if we're doing multiple swaps and if multicall is available
      const useMulticall = swapQuotes.length > 1 && tokensConfig.hyperEVM.contracts.multicall3

      if (swapQuotes.length > 1) {
        console.log('[executeSwap] Multiple swaps detected.', {
          count: swapQuotes.length,
          useMulticall,
          multicallAddress: tokensConfig.hyperEVM.contracts.multicall3
        })

        if (useMulticall) {
          // Use multicall to combine all swaps into one transaction
          console.log('[executeSwap] Using Multicall3 to batch transactions')

          try {
            const multicallTx = combineSwapQuotes(swapQuotes)

            console.log('[executeSwap] Multicall transaction prepared:', {
              to: multicallTx.to,
              value: multicallTx.value.toString(),
              gas: multicallTx.gas.toString(),
              dataLength: multicallTx.data.length
            })

            // Show user what's happening
            const outputTokens = poolConfig?.outputTokens || []
            const swapSummary = outputTokens.map((token, i) => {
              const quote = swapQuotes[i]
              return `${formatTokenAmount(quote.buyAmount, token)} ${token}`
            }).join(' + ')

            toast.loading(`Swapping ${inputAmount} ${inputTokenSymbol} for ${swapSummary}...`, {
              id: 'multicall-swap'
            })

            // Format transaction with enhanced metadata
            const formattedTx = formatTransactionForWallet({
              to: multicallTx.to,
              data: multicallTx.data,
              value: multicallTx.value,
              inputAmount,
              inputToken: inputTokenSymbol,
              outputTokens: poolConfig?.outputTokens || [],
              ratios
            })

            // Execute the multicall transaction with enhanced metadata
            const tx = await sendTransactionAsync({
              ...formattedTx,
              gas: multicallTx.gas,
              from: address as `0x${string}`,
              chainId: 999,
              // Additional metadata for better wallet display
              account: address as `0x${string}`,
            } as any)

            console.log('[executeSwap] Multicall transaction sent:', tx)

            toast.success(`Successfully swapped for ${swapSummary}!`, {
              id: 'multicall-swap'
            })

            // Return single transaction hash
            const txHashes = [tx]
            console.log('[executeSwap] All swaps completed in one transaction:', tx)

            // Show final success message
            if (txHashes.length > 0) {
              toast.success(`Swap completed successfully!`)
            }

            // Store first tx hash for tracking
            setState(prev => ({
              ...prev,
              isSwapping: false,
              txHash: txHashes[0]
            }))

            // Format output for display
            if (state.quote) {
              const outputs = state.quote.outputTokens
                .map((token, i) => `${formatTokenAmount(state.quote!.minOutputAmounts[i], token)} ${token}`)
                .join(' + ')
              toast.info(`You will receive at least: ${outputs}`)
            }

            return {
              success: true,
              txHashes
            }
          } catch (error) {
            console.error('[executeSwap] Multicall failed:', error)
            // Fall back to sequential execution
            console.log('[executeSwap] Falling back to sequential execution')
          }
        }

        // Show user what will happen with sequential execution
        const swapDetails = swapQuotes.map((q, i) => {
          const outputToken = poolConfig?.outputTokens[i] || 'Unknown'
          return `Swap ${i + 1}: ${inputAmount} ${inputTokenSymbol} → ${outputToken}`
        }).join('\n')

        toast.info(`Processing ${swapQuotes.length} swaps sequentially:\n${swapDetails}`)
      }

      // Sequential execution (fallback or single swap)
      const txHashes = []
      for (let index = 0; index < swapQuotes.length; index++) {
        const quote = swapQuotes[index]
        const outputToken = poolConfig?.outputTokens[index] || 'Token'

        console.log(`[executeSwap] Processing swap ${index + 1}/${swapQuotes.length}:`, {
          outputToken,
          to: quote.to,
          value: quote.value,
          gas: quote.gas
        })

        // Add transaction metadata with more details for wallet display
        const txRequest = {
          to: quote.to as `0x${string}`,
          data: quote.data as `0x${string}`,
          value: safeBigInt(quote.value, 0n),
          gas: safeBigInt(Math.floor(safeNumber(quote.gas, 300000) * 1.2), 360000n), // 20% buffer with safe conversion
          from: address as `0x${string}`,
          chainId: 999,
          // Add gasPrice if available with safe conversion
          ...(quote.gasPrice && { gasPrice: safeBigInt(quote.gasPrice) }),
          // Additional metadata
          account: address as `0x${string}`,
        } as any

        // Log transaction details for debugging
        console.log(`[executeSwap] Transaction ${index + 1} details:`, {
          to: txRequest.to,
          value: txRequest.value.toString(),
          gas: txRequest.gas.toString(),
          dataLength: txRequest.data.length,
          expectedOutput: `${quote.buyAmount} ${outputToken}`,
          sellAmount: quote.sellAmount,
          buyAmount: quote.buyAmount,
          buyTokenAddress: quote.buyTokenAddress,
          sellTokenAddress: quote.sellTokenAddress
        })

        try {
          // Show which swap is being executed
          if (swapQuotes.length > 1) {
            toast.loading(`Swap ${index + 1}/${swapQuotes.length}: Getting ${outputToken}...`, {
              id: `swap-${index}`
            })
          }

          const tx = await sendTransactionAsync(txRequest)
          console.log(`[executeSwap] Transaction ${index + 1} sent:`, tx)
          txHashes.push(tx)

          // Success message for individual swap
          if (swapQuotes.length > 1) {
            toast.success(`Swap ${index + 1} completed!`, {
              id: `swap-${index}`
            })
          }

          // Wait a bit between transactions to avoid wallet issues
          if (index < swapQuotes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } catch (txError) {
          console.error(`[executeSwap] Transaction ${index + 1} failed:`, txError)
          toast.error(`Swap ${index + 1} failed: ${txError instanceof Error ? txError.message : 'Unknown error'}`, {
            id: `swap-${index}`
          })

          // Ask user if they want to continue with remaining swaps
          if (index < swapQuotes.length - 1) {
            // For now, stop on first error
            throw txError
          }
        }
      }

      console.log('[executeSwap] All transactions completed:', txHashes)

      // Show final success message
      if (txHashes.length > 0) {
        toast.success(`Successfully completed ${txHashes.length} swap${txHashes.length > 1 ? 's' : ''}!`)
      }

      // Store first tx hash for tracking
      setState(prev => ({
        ...prev,
        isSwapping: false,
        txHash: txHashes[0]
      }))

      // Format output for display
      if (state.quote) {
        const outputs = state.quote.outputTokens
          .map((token, i) => `${formatTokenAmount(state.quote!.minOutputAmounts[i], token)} ${token}`)
          .join(' + ')
        toast.info(`You will receive at least: ${outputs}`)
      }

      return {
        success: true,
        txHashes
      }
    } catch (error: any) {
      console.error('[executeSwap] Swap failed with error:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        response: error?.response
      })

      // Check if error is from API about allowance
      if (error?.message?.includes('allowance') || error?.message?.includes('Insufficient token allowance')) {
        console.error('[executeSwap] Allowance error detected!')
        console.log('[executeSwap] Current state:', {
          inputToken: inputTokenSymbol,
          amount: inputAmount,
          userAddress: address
        })
      }

      const errorMessage = error instanceof Error ? error.message : 'Swap failed'
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isSwapping: false
      }))
      toast.error(errorMessage)
      return null
    }
  }, [isConnected, address, ensureHyperEVM, sendTransactionAsync, state.quote])

  // Clear quote
  const clearQuote = useCallback(() => {
    setState(prev => ({ ...prev, quote: null, error: null }))
  }, [])

  // Approve token manually (for UI button)
  const approveInputToken = useCallback(async (
    poolId: string,
    inputAmount: string
  ) => {
    // Find pool config - check both by key and by id
    const poolKey = poolId.toUpperCase().replace(/-/g, '-')
    const poolConfig = tokensConfig.hyperEVM.pools[poolKey as keyof typeof tokensConfig.hyperEVM.pools] ||
                       Object.values(tokensConfig.hyperEVM.pools).find(p => p.id === poolId)

    if (!poolConfig) {
      console.error('[useSwap] Pool not found:', poolId)
      toast.error(`Pool ${poolId} not found`)
      return false
    }

    const inputTokenSymbol = poolConfig.inputToken

    console.log('[useSwap] Approving token for pool:', {
      poolId,
      poolKey,
      poolConfig,
      inputTokenSymbol,
      inputAmount,
      availablePools: Object.keys(tokensConfig.hyperEVM.pools)
    })

    setState(prev => ({ ...prev, isApproving: true }))

    try {
      console.log('[useSwap] Calling approveToken with:', inputTokenSymbol, inputAmount)
      const approved = await approveToken(inputTokenSymbol, inputAmount)
      console.log('[useSwap] Approval result:', approved)

      setState(prev => ({
        ...prev,
        isApproving: false,
        needsApproval: !approved
      }))

      if (!approved) {
        console.error('[useSwap] Token approval failed')
        toast.error('Failed to approve token')
      }

      return approved
    } catch (error) {
      console.error('[useSwap] Error during approval:', error)
      setState(prev => ({
        ...prev,
        isApproving: false,
        error: error instanceof Error ? error.message : 'Approval failed'
      }))
      return false
    }
  }, [approveToken])

  // Approve max amount for input token
  const approveMaxInputToken = useCallback(async (
    poolId: string
  ) => {
    // Find pool config - check both by key and by id
    const poolKey = poolId.toUpperCase().replace(/-/g, '-')
    const poolConfig = tokensConfig.hyperEVM.pools[poolKey as keyof typeof tokensConfig.hyperEVM.pools] ||
                       Object.values(tokensConfig.hyperEVM.pools).find(p => p.id === poolId)

    if (!poolConfig) {
      console.error('[useSwap] Pool not found:', poolId)
      toast.error(`Pool ${poolId} not found`)
      return false
    }

    const inputTokenSymbol = poolConfig.inputToken

    console.log('[useSwap] Approving max amount for token:', {
      poolId,
      poolConfig,
      inputTokenSymbol
    })

    setState(prev => ({ ...prev, isApproving: true }))

    try {
      console.log('[useSwap] Calling approveMax with:', inputTokenSymbol)
      const approved = await approveMax(inputTokenSymbol)
      console.log('[useSwap] Max approval result:', approved)

      setState(prev => ({
        ...prev,
        isApproving: false,
        needsApproval: !approved
      }))

      if (approved) {
        toast.success('Unlimited spending approved!')
      } else {
        console.error('[useSwap] Max approval failed')
        toast.error('Failed to approve unlimited spending')
      }

      return approved
    } catch (error) {
      console.error('[useSwap] Error during max approval:', error)
      setState(prev => ({
        ...prev,
        isApproving: false,
        error: error instanceof Error ? error.message : 'Max approval failed'
      }))
      return false
    }
  }, [approveMax])

  return {
    ...state,
    isApproving: state.isApproving || isApprovingToken,
    getQuote,
    executeSwap,
    approveInputToken,
    approveMaxInputToken,
    clearQuote,
    isConnected,
    address,
  }
}

// Toast utility (simplified implementation)
// You might want to install react-hot-toast or react-toastify for better toast notifications