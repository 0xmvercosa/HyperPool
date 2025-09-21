import { mainnet, sepolia, base, baseSepolia } from 'viem/chains'
import { hyperEVM } from './chains'

export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
}

export const supportedChains = {
  hyperEVM: {
    id: hyperEVM.id,
    name: hyperEVM.name,
    rpcUrl: hyperEVM.rpcUrls.default.http[0],
  },
  mainnet: {
    id: mainnet.id,
    name: mainnet.name,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || mainnet.rpcUrls.default.http[0],
  },
  base: {
    id: base.id,
    name: base.name,
    rpcUrl: base.rpcUrls.default.http[0],
  },
}

export const DEFAULT_CHAIN = hyperEVM