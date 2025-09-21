'use client'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useAccount, useBalance, useDisconnect, useSwitchChain } from 'wagmi'
import { useCallback, useEffect, useMemo } from 'react'
import { formatEther, parseEther } from 'viem'
import { useStore } from '@/lib/store/useStore'
import { hyperEVM } from '@/lib/config/chains'

export function useWallet() {
  const {
    ready,
    authenticated,
    login,
    logout,
    user,
    linkWallet,
    unlinkWallet,
  } = usePrivy()

  const { wallets } = useWallets()
  const { address, isConnected: wagmiConnected, chainId } = useAccount()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  const {
    setWallet,
    setBalance: setStoreBalance,
    disconnectWallet: storeDisconnect,
  } = useStore()

  // Get the active wallet
  const activeWallet = useMemo(() => {
    if (!wallets || wallets.length === 0) return null
    // Prioritize embedded wallet if available
    return wallets.find(w => w.walletClientType === 'privy') || wallets[0]
  }, [wallets])

  // Get balance for the active address
  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useBalance({
    address: address as `0x${string}` | undefined,
    query: {
      enabled: !!address,
    },
  })

  // Format balance
  const formattedBalance = useMemo(() => {
    if (!balanceData) return '0'
    return formatEther(balanceData.value)
  }, [balanceData])

  // Update store when wallet changes
  useEffect(() => {
    if (authenticated && activeWallet?.address) {
      setWallet(activeWallet.address)
    } else if (!authenticated) {
      storeDisconnect()
    }
  }, [authenticated, activeWallet, setWallet, storeDisconnect])

  // Update balance in store
  useEffect(() => {
    if (formattedBalance && formattedBalance !== '0') {
      setStoreBalance(formattedBalance)
    }
  }, [formattedBalance, setStoreBalance])

  // Auto-switch to HyperEVM when connected
  useEffect(() => {
    if (authenticated && chainId && chainId !== hyperEVM.id) {
      const timer = setTimeout(async () => {
        try {
          await switchChain({ chainId: hyperEVM.id })
        } catch (error) {
          console.log('Auto-switching to HyperEVM...', error)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [authenticated, chainId, switchChain])

  // Connect wallet function
  const connectWallet = useCallback(async () => {
    try {
      if (!authenticated) {
        await login()
      }
      // After login, try to switch to HyperEVM
      if (chainId && chainId !== hyperEVM.id) {
        setTimeout(async () => {
          try {
            await switchChain({ chainId: hyperEVM.id })
          } catch (error) {
            console.log('Switching to HyperEVM...', error)
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }, [authenticated, login, chainId, switchChain])

  // Disconnect wallet function
  const disconnectWallet = useCallback(async () => {
    try {
      if (wagmiConnected) {
        disconnect()
      }
      await logout()
      storeDisconnect()
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }, [wagmiConnected, disconnect, logout, storeDisconnect])

  // Switch wallet function
  const switchWallet = useCallback(async () => {
    try {
      await linkWallet()
    } catch (error) {
      console.error('Failed to switch wallet:', error)
    }
  }, [linkWallet])

  // Send transaction function
  const sendTransaction = useCallback(async (
    to: string,
    value: string,
  ) => {
    if (!activeWallet) {
      throw new Error('No wallet connected')
    }

    try {
      const provider = await activeWallet.getEthereumProvider()
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: activeWallet.address,
          to,
          value: parseEther(value).toString(16),
        }],
      })
      return txHash
    } catch (error) {
      console.error('Transaction failed:', error)
      throw error
    }
  }, [activeWallet])

  // Sign message function
  const signMessage = useCallback(async (message: string) => {
    if (!activeWallet) {
      throw new Error('No wallet connected')
    }

    try {
      const signature = await activeWallet.sign(message)
      return signature
    } catch (error) {
      console.error('Failed to sign message:', error)
      throw error
    }
  }, [activeWallet])

  return {
    // State
    isReady: ready,
    isConnected: authenticated && !!activeWallet,
    address: activeWallet?.address || address,
    balance: formattedBalance,
    balanceLoading,
    user,
    wallets,
    activeWallet,

    // Actions
    connectWallet,
    disconnectWallet,
    switchWallet,
    sendTransaction,
    signMessage,
    refetchBalance,

    // Raw Privy functions for advanced use
    login,
    logout,
    linkWallet,
    unlinkWallet,
  }
}