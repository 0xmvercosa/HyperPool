'use client'

import { useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useSwitchChain, useChainId } from 'wagmi'
import { hyperEVM } from '@/lib/config/chains'
import { toast } from 'react-hot-toast'

/**
 * Custom hook to ensure the user is on HyperEVM network
 * Automatically switches to HyperEVM after wallet connection
 */
export function useHyperEVM() {
  const { authenticated, ready } = usePrivy()
  const { switchChain } = useSwitchChain()
  const chainId = useChainId()

  // Auto-switch to HyperEVM when authenticated
  useEffect(() => {
    if (authenticated && ready && chainId && chainId !== hyperEVM.id) {
      // Small delay to ensure wallet is fully connected
      const timer = setTimeout(() => {
        switchToHyperEVM()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [authenticated, ready, chainId])

  const switchToHyperEVM = async () => {
    try {
      await switchChain({ chainId: hyperEVM.id })
      toast.success('Switched to HyperEVM network')
    } catch (error) {
      console.error('Failed to switch to HyperEVM:', error)
      // Don't show error toast as user may have rejected
    }
  }

  const ensureHyperEVM = async (): Promise<boolean> => {
    if (chainId === hyperEVM.id) {
      return true
    }

    try {
      await switchChain({ chainId: hyperEVM.id })
      return true
    } catch (error) {
      console.error('Failed to switch to HyperEVM:', error)
      toast.error('Please switch to HyperEVM network to continue')
      return false
    }
  }

  return {
    isOnHyperEVM: chainId === hyperEVM.id,
    switchToHyperEVM,
    ensureHyperEVM,
    currentChainId: chainId
  }
}