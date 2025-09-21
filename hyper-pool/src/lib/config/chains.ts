import { defineChain } from 'viem'

/**
 * HyperEVM Chain Configuration
 *
 * Official Hyperliquid L1 blockchain configuration.
 * This is the main network where all Hyper Pool operations occur.
 *
 * @see https://docs.hyperliquid.xyz for official documentation
 */
export const hyperEVM = defineChain({
  id: 999, // Official HyperEVM chain ID
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
      webSocket: undefined,
    },
    public: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
      webSocket: undefined,
    },
  },
  blockExplorers: {
    default: {
      name: 'HyperEVM Explorer',
      url: 'https://explorer.hyperliquid.xyz',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11' as `0x${string}`,
      blockCreated: 0,
    },
  },
  testnet: false,
}) as const

/**
 * Token Addresses on HyperEVM
 *
 * These are the official token addresses on HyperEVM (Hyperliquid L1)
 * Source: Hyperliquid official documentation
 */
export const HYPEREVM_TOKENS = {
  USDC: {
    address: '0xb88339CB7199b77E23DB6E890353E22632Ba630f', // Official USDC on HyperEVM
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '💵',
  },
  HYPE: {
    address: '0x0000000000000000000000000000000000000000', // Native token (use zero address for native)
    symbol: 'HYPE',
    name: 'Hyper Token',
    decimals: 18,
    icon: '🚀',
  },
  USDT: {
    address: '0x5f3E8A24fCb582A5468D532fE655CC21AfEFCE48', // Official USDT on HyperEVM (if available)
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    icon: '💰',
  },
}

/**
 * Available Pool Configurations
 *
 * Defines the available liquidity pools and their parameters.
 * Ratios are default values and can be adjusted by users.
 */
export const HYPEREVM_POOLS = {
  'USDC-HYPE-USDT': {
    id: 'usdc-hype-usdt',
    name: 'USDC/HYPE/USDT Pool',
    tokens: ['USDC', 'HYPE', 'USDT'],
    defaultRatio: [50, 25, 25], // Default 50/25/25 split (will be dynamic later)
    icon: '🔄',
  },
}

/**
 * Hyperbloom API Configuration
 * API keys should be stored in environment variables only
 */
export const HYPERBLOOM_CONFIG = {
  apiUrl: process.env.NEXT_PUBLIC_HYPERBLOOM_API_URL || 'https://api.hyperbloom.io',
  apiKey: process.env.NEXT_PUBLIC_HYPERBLOOM_API_KEY || '',
}