'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/hooks/useWallet';
import { useHyperEVM } from '@/lib/hooks/useHyperEVM';
import { shortenAddress } from '@/lib/utils/format';
import { ChevronDown, LogOut, Wallet, Loader2, AlertCircle } from 'lucide-react';

export function WalletDisplay() {
  const { isConnected, address, balance, disconnectWallet, switchWallet, wallets } = useWallet();
  const { isOnHyperEVM, switchToHyperEVM } = useHyperEVM();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await disconnectWallet();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setIsLoading(false);
      setShowDropdown(false);
    }
  };

  const handleSwitchWallet = async () => {
    setIsLoading(true);
    try {
      await switchWallet();
    } catch (error) {
      console.error('Failed to switch wallet:', error);
    } finally {
      setIsLoading(false);
      setShowDropdown(false);
    }
  };

  if (!isConnected || !address) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all duration-200"
      >
        <div className={`w-2 h-2 rounded-full ${isOnHyperEVM ? 'bg-[#8CFF00]' : 'bg-yellow-500'} animate-pulse`} />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-white">
            {shortenAddress(address)}
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">
              {balance?.usdc ? `$${balance.usdc.toFixed(2)}` : '$0.00'}
            </span>
            {balance?.native !== undefined && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400">
                  {balance.native.toFixed(4)} HYPE
                </span>
              </>
            )}
          </div>
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
  );
}