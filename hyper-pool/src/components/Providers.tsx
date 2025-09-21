'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { useState, useEffect } from 'react'
import { PrivyProvider, usePrivy } from '@privy-io/react-auth'
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
          showWalletLoginFirst: true,
        },
        loginMethods: ['email', 'google', 'wallet'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        // Network configuration
        network: {
          chainId: 999,
          rpcUrl: 'https://rpc.hyperliquid.xyz/evm',
        },
        // Supported chains configuration
        supportedChains: [
          {
            id: 999,
            name: 'HyperEVM',
            network: 'hyperevm',
            nativeCurrency: {
              name: 'HYPE',
              symbol: 'HYPE',
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ['https://rpc.hyperliquid.xyz/evm'],
              },
            },
            blockExplorers: {
              default: {
                name: 'HyperEVM Explorer',
                url: 'https://explorer.hyperliquid.xyz',
              },
            },
            testnet: false,
          },
        ],
        defaultChain: {
          id: 999,
          name: 'HyperEVM',
          network: 'hyperevm',
          nativeCurrency: {
            name: 'HYPE',
            symbol: 'HYPE',
            decimals: 18,
          },
          rpcUrls: {
            default: {
              http: ['https://rpc.hyperliquid.xyz/evm'],
            },
          },
          blockExplorers: {
            default: {
              name: 'HyperEVM Explorer',
              url: 'https://explorer.hyperliquid.xyz',
            },
          },
          testnet: false,
        },
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