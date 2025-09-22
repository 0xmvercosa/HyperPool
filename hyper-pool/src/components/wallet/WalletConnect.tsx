'use client'

import { useWallet } from '@/lib/hooks/useWallet'
import { useHyperEVM } from '@/lib/hooks/useHyperEVM'
import { cn, shortenAddress } from '@/lib/utils/format'
import { Wallet, LogOut, Loader2, ChevronDown, AlertCircle } from 'lucide-react'
import { useState } from 'react'

export function WalletConnect() {
  const {
    isConnected,
    isReady,
    address,
    balance,
    connectWallet,
    disconnectWallet,
    switchWallet,
    wallets
  } = useWallet()

  const { isOnHyperEVM, switchToHyperEVM } = useHyperEVM()

  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      await connectWallet()
    } catch (error) {
      console.error('Failed to connect:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      await disconnectWallet()
    } catch (error) {
      console.error('Failed to disconnect:', error)
    } finally {
      setIsLoading(false)
      setShowDropdown(false)
    }
  }

  const handleSwitchWallet = async () => {
    setIsLoading(true)
    try {
      await switchWallet()
    } catch (error) {
      console.error('Failed to switch wallet:', error)
    } finally {
      setIsLoading(false)
      setShowDropdown(false)
    }
  }

  if (!isReady) {
    return (
      <button
        disabled
        className="bg-[#8CFF00] text-black font-medium px-6 py-2.5 rounded-xl flex items-center gap-2 opacity-50 cursor-not-allowed"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading...</span>
      </button>
    )
  }

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all duration-200"
        >
          <div className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            isOnHyperEVM ? "bg-[#8CFF00]" : "bg-yellow-500"
          )} />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-white">{shortenAddress(address)}</span>
            <span className="text-xs text-gray-400">
              {isOnHyperEVM ? "HyperEVM" : "Wrong Network"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50">
            {!isOnHyperEVM && (
              <button
                onClick={switchToHyperEVM}
                className="w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors rounded-t-xl flex items-center gap-2 text-yellow-500"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Switch to HyperEVM</span>
              </button>
            )}
            {wallets && wallets.length > 1 && (
              <button
                onClick={handleSwitchWallet}
                disabled={isLoading}
                className="w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors flex items-center gap-2 text-white"
              >
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Switch Wallet</span>
              </button>
            )}
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors rounded-b-xl flex items-center gap-2 text-red-500"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span className="text-sm">Disconnect</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className="bg-[#8CFF00] hover:bg-[#7AE600] text-black font-medium px-6 py-2.5 rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-2"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Wallet className="w-5 h-5" />
      )}
      <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
    </button>
  )
}