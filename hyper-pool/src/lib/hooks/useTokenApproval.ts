'use client'

import { useState, useCallback } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseUnits, formatUnits, Address, erc20Abi, getAddress } from 'viem'
import { toast } from 'react-hot-toast'
import tokensConfig from '@/config/tokens.json'

// HyperBloom swap router address - ensure proper checksum
// This is the correct address from HyperBloom API's allowanceTarget
const HYPERBLOOM_ROUTER_RAW = '0x4212a77e4533eCa49643d7B731F5FB1b2782FE94'
const HYPERBLOOM_ROUTER = getAddress(HYPERBLOOM_ROUTER_RAW) as Address

console.log('[TokenApproval] HyperBloom Router Address (checksummed):', HYPERBLOOM_ROUTER)

export function useTokenApproval() {
  const { address, chain } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [isApproving, setIsApproving] = useState(false)
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false)

  console.log('[TokenApproval] Hook initialized:', {
    address,
    chainId: chain?.id,
    chainName: chain?.name,
    hasPublicClient: !!publicClient,
    hasWalletClient: !!walletClient
  })

  // Check current allowance for a token
  const checkAllowance = useCallback(async (
    tokenSymbol: string,
    spenderAddress?: Address
  ): Promise<bigint> => {
    console.log('[checkAllowance] Called with:', {
      tokenSymbol,
      spenderAddress,
      hasAddress: !!address,
      hasPublicClient: !!publicClient
    })

    if (!address || !publicClient) {
      console.log('[checkAllowance] No wallet connected or client not ready')
      return 0n
    }

    const spender = spenderAddress || HYPERBLOOM_ROUTER
    const token = tokensConfig.hyperEVM.tokens[tokenSymbol as keyof typeof tokensConfig.hyperEVM.tokens]

    if (!token) {
      console.error('[checkAllowance] Token not found:', tokenSymbol)
      return 0n
    }

    // Native token doesn't need approval
    if ('isNative' in token && token.isNative) {
      console.log('[checkAllowance] Native token, infinite approval')
      return BigInt(Number.MAX_SAFE_INTEGER)
    }

    setIsCheckingAllowance(true)
    try {
      const tokenAddress = getAddress(token.address) as Address

      console.log('[checkAllowance] Checking allowance:', {
        token: tokenSymbol,
        tokenAddress,
        owner: address,
        spender
      })

      let allowance: bigint
      try {
        allowance = await publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [address, spender]
        })
      } catch (readError: any) {
        console.error('[checkAllowance] Error reading allowance:', {
          error: readError,
          message: readError?.message,
          tokenAddress,
          owner: address,
          spender
        })
        throw readError
      }

      console.log('[Approval] Current allowance:', {
        token: tokenSymbol,
        allowance: allowance.toString(),
        allowanceFormatted: formatUnits(allowance, token.decimals)
      })

      return allowance
    } catch (error: any) {
      console.error('[checkAllowance] Error checking allowance:', {
        error,
        message: error?.message,
        tokenSymbol,
        tokenAddress: token?.address
      })
      return 0n
    } finally {
      setIsCheckingAllowance(false)
    }
  }, [address, publicClient])

  // Approve token spending
  const approveToken = useCallback(async (
    tokenSymbol: string,
    amount: string,
    spenderAddress?: Address
  ): Promise<boolean> => {
    console.log('[Approval] approveToken called:', {
      tokenSymbol,
      amount,
      spenderAddress,
      hasAddress: !!address,
      hasWalletClient: !!walletClient,
      hasPublicClient: !!publicClient
    })

    if (!address || !walletClient || !publicClient) {
      console.error('[Approval] Missing wallet connection:', {
        address,
        walletClient: !!walletClient,
        publicClient: !!publicClient
      })
      toast.error('Please connect your wallet')
      return false
    }

    const spender = spenderAddress || HYPERBLOOM_ROUTER
    const token = tokensConfig.hyperEVM.tokens[tokenSymbol as keyof typeof tokensConfig.hyperEVM.tokens]

    console.log('[Approval] Token config:', {
      tokenSymbol,
      tokenFound: !!token,
      tokenAddress: token?.address,
      isNative: token?.isNative,
      spender
    })

    if (!token) {
      console.error('[Approval] Token not found in config:', tokenSymbol)
      console.log('[Approval] Available tokens:', Object.keys(tokensConfig.hyperEVM.tokens))
      toast.error(`Token ${tokenSymbol} not found`)
      return false
    }

    // Native token doesn't need approval
    if ('isNative' in token && token.isNative) {
      console.log('[Approval] Native token detected, no approval needed')
      return true
    }

    setIsApproving(true)
    try {
      // Ensure token address is checksummed
      const tokenAddress = getAddress(token.address) as Address

      console.log('[Approval] Token address (checksummed):', tokenAddress)
      console.log('[Approval] Parsing amount:', {
        amount,
        decimals: token.decimals
      })

      let amountInWei: bigint
      try {
        // Add 1% buffer to the approval amount to account for fees/slippage
        const amountFloat = parseFloat(amount)
        const amountWithBuffer = amountFloat * 1.01 // 1% buffer
        amountInWei = parseUnits(amountWithBuffer.toString(), token.decimals)
        console.log('[Approval] Amount parsed with 1% buffer:', {
          originalAmount: amount,
          amountWithBuffer: amountWithBuffer.toString(),
          amountInWei: amountInWei.toString()
        })
      } catch (parseError) {
        console.error('[Approval] Error parsing amount:', parseError)
        throw new Error(`Invalid amount: ${amount}`)
      }

      // Check current allowance
      console.log('[Approval] Checking current allowance...')
      const currentAllowance = await checkAllowance(tokenSymbol, spender)

      if (currentAllowance >= amountInWei) {
        console.log('[Approval] Sufficient allowance already exists:', {
          current: currentAllowance.toString(),
          required: amountInWei.toString()
        })
        toast.success('Token already approved')
        return true
      }

      console.log('[Approval] Approving token:', {
        token: tokenSymbol,
        tokenAddress,
        spender,
        amount,
        amountInWei: amountInWei.toString()
      })

      // Request approval transaction
      console.log('[Approval] Requesting approval transaction:', {
        tokenAddress,
        spender,
        amount: amountInWei.toString(),
        chainId: walletClient.chain?.id,
        chainName: walletClient.chain?.name,
        walletClientReady: !!walletClient
      })

      // Validate token address format
      if (!tokenAddress || !tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
        console.error('[Approval] Invalid token address format:', tokenAddress)
        throw new Error(`Invalid token address: ${tokenAddress}`)
      }

      let hash: `0x${string}`
      try {
        console.log('[Approval] About to call writeContract...')
        hash = await walletClient.writeContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [spender, amountInWei],
          chain: walletClient.chain
        })
        console.log('[Approval] Transaction hash received:', hash)
      } catch (writeError: any) {
        console.error('[Approval] Error writing contract:', {
          error: writeError,
          message: writeError?.message,
          code: writeError?.code,
          details: writeError?.details
        })
        throw writeError
      }

      toast.loading('Approving token...', { id: 'approve' })

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1
      })

      if (receipt.status === 'success') {
        console.log('[Approval] Token approved successfully:', receipt)
        toast.success('Token approved!', { id: 'approve' })
        return true
      } else {
        console.error('[Approval] Approval transaction failed')
        toast.error('Approval failed', { id: 'approve' })
        return false
      }
    } catch (error: any) {
      console.error('[Approval] Error approving token:', {
        error,
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        cause: error?.cause
      })

      if (error?.message?.includes('User rejected') || error?.message?.includes('User denied')) {
        toast.error('Transaction rejected', { id: 'approve' })
      } else if (error?.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds for gas', { id: 'approve' })
      } else if (error?.message?.includes('Invalid amount')) {
        toast.error(error.message, { id: 'approve' })
      } else {
        toast.error(`Failed to approve token: ${error?.message || 'Unknown error'}`, { id: 'approve' })
      }

      return false
    } finally {
      setIsApproving(false)
    }
  }, [address, walletClient, publicClient, checkAllowance])

  // Check if token needs approval for a specific amount
  const needsApproval = useCallback(async (
    tokenSymbol: string,
    amount: string,
    spenderAddress?: Address
  ): Promise<boolean> => {
    const token = tokensConfig.hyperEVM.tokens[tokenSymbol as keyof typeof tokensConfig.hyperEVM.tokens]

    if (!token) {
      console.error('[Approval] Token not found:', tokenSymbol)
      return false
    }

    // Native token doesn't need approval
    if ('isNative' in token && token.isNative) {
      return false
    }

    const spender = spenderAddress || HYPERBLOOM_ROUTER
    // Check against amount with 1% buffer (same as approval)
    const amountFloat = parseFloat(amount)
    const amountWithBuffer = amountFloat * 1.01 // 1% buffer
    const amountInWei = parseUnits(amountWithBuffer.toString(), token.decimals)
    const currentAllowance = await checkAllowance(tokenSymbol, spender)

    console.log('[needsApproval] Checking approval requirement:', {
      tokenSymbol,
      originalAmount: amount,
      amountWithBuffer: amountWithBuffer.toString(),
      requiredAllowance: amountInWei.toString(),
      currentAllowance: currentAllowance.toString(),
      needsApproval: currentAllowance < amountInWei
    })

    return currentAllowance < amountInWei
  }, [checkAllowance])

  // Approve max amount (useful for avoiding multiple approvals)
  const approveMax = useCallback(async (
    tokenSymbol: string,
    spenderAddress?: Address
  ): Promise<boolean> => {
    if (!address || !walletClient || !publicClient) {
      toast.error('Please connect your wallet')
      return false
    }

    const spender = spenderAddress || HYPERBLOOM_ROUTER
    const token = tokensConfig.hyperEVM.tokens[tokenSymbol as keyof typeof tokensConfig.hyperEVM.tokens]

    if (!token) {
      toast.error(`Token ${tokenSymbol} not found`)
      return false
    }

    // Native token doesn't need approval
    if ('isNative' in token && token.isNative) {
      return true
    }

    setIsApproving(true)
    try {
      const tokenAddress = token.address as Address
      const maxAmount = (BigInt(2) ** BigInt(256)) - BigInt(1) // Max uint256

      console.log('[Approval] Approving max amount for token:', {
        token: tokenSymbol,
        tokenAddress,
        spender
      })

      // Request approval transaction
      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, maxAmount],
        chain: walletClient.chain
      })

      toast.loading('Approving unlimited spending...', { id: 'approve-max' })

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1
      })

      if (receipt.status === 'success') {
        console.log('[Approval] Max amount approved successfully:', receipt)
        toast.success('Unlimited spending approved!', { id: 'approve-max' })
        return true
      } else {
        console.error('[Approval] Max approval transaction failed')
        toast.error('Approval failed', { id: 'approve-max' })
        return false
      }
    } catch (error: any) {
      console.error('[Approval] Error approving max amount:', error)

      if (error?.message?.includes('User rejected')) {
        toast.error('Transaction rejected', { id: 'approve-max' })
      } else {
        toast.error('Failed to approve token', { id: 'approve-max' })
      }

      return false
    } finally {
      setIsApproving(false)
    }
  }, [address, walletClient, publicClient])

  return {
    checkAllowance,
    approveToken,
    approveMax,
    needsApproval,
    isApproving,
    isCheckingAllowance,
    HYPERBLOOM_ROUTER
  }
}