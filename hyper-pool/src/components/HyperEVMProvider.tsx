'use client'

import { useEffect } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { hyperEVM } from '@/lib/config/chains'

// Custom Wagmi config for HyperEVM
const hyperEVMConfig = createConfig({
  chains: [hyperEVM],
  transports: {
    [hyperEVM.id]: http(hyperEVM.rpcUrls.default.http[0]),
  },
})

export function HyperEVMProvider({ children }: { children: React.ReactNode }) {
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()

  useEffect(() => {
    if (authenticated && wallets.length > 0) {
      // Force switch to HyperEVM after authentication
      const switchToHyperEVM = async () => {
        try {
          const wallet = wallets[0]
          if (wallet && 'switchChain' in wallet) {
            await wallet.switchChain(999)
          }
        } catch (error) {
          console.log('Switching to HyperEVM...', error)
        }
      }

      // Small delay to ensure wallet is ready
      setTimeout(switchToHyperEVM, 500)
    }
  }, [authenticated, wallets])

  return (
    <WagmiProvider config={hyperEVMConfig}>
      {children}
    </WagmiProvider>
  )
}