'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { useState } from 'react'
import { PrivyProvider } from '@privy-io/react-auth'
import { privyConfig } from '@/lib/config/privy'
import { hyperEVM } from '@/lib/config/chains'

// Wagmi configuration with HyperEVM only
const wagmiConfig = createConfig({
  chains: [hyperEVM],
  transports: {
    [hyperEVM.id]: http(hyperEVM.rpcUrls.default.http[0]),
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <PrivyProvider
      appId={privyConfig.appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#8CFF00',
          showWalletLoginFirst: false, // Show email/Google first
        },
        loginMethods: ['email', 'google', 'wallet'], // Email and Google first
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
        // Wallet configuration - keep default supported wallets including Rabby
        wallets: {
          includeWallets: [
            'metamask',
            'rainbow',
            'coinbase_wallet',
            'wallet_connect',
            'rabby', // Rabby Wallet support
            'zerion',
            'phantom',
            'okx',
            'trust',
          ],
        },
        // Additional wallet options
        externalWallets: {
          disableInjectedWalletDiscovery: false, // Auto-detect Rabby and other injected wallets
        },
        // Custom chains configuration
        customChains: [
          {
            id: hyperEVM.id,
            name: hyperEVM.name,
            network: hyperEVM.network,
            nativeCurrency: hyperEVM.nativeCurrency,
            rpcUrls: {
              default: { http: hyperEVM.rpcUrls.default.http },
            },
            blockExplorers: hyperEVM.blockExplorers,
            testnet: false,
          },
        ],
        // Set HyperEVM as default
        defaultChain: {
          id: hyperEVM.id,
          rpcUrl: hyperEVM.rpcUrls.default.http[0],
        },
        supportedChains: [
          {
            id: hyperEVM.id,
            rpcUrl: hyperEVM.rpcUrls.default.http[0],
          },
        ],
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  )
}