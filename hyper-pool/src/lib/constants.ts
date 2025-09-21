export const MOCK_DATA = {
  userBalance: "2345.56",
  earningPool: "1345.45",
  pendingRewards: "13.54",
  apy: 8.7,
  pools: [
    {
      id: "usdc-whype-usdt",
      name: "USDC → WHYPE/USDT",
      description: "Invest USDC in WHYPE/USDT liquidity pool with customizable ratio.",
      apy: 8.7,
      risk: "low" as const,
      tvl: 5000000,
      userInvested: "500.00",
      icon: "🔄",
      color: "from-green-500 to-emerald-500",
      isSwapPool: true,
      tokens: ['USDC', 'WHYPE', 'USDT'],
    },
    {
      id: "low-risk",
      name: "Stable Yield Pool",
      description: "Conservative liquidity pool with steady returns from trading fees.",
      apy: 12.3,
      risk: "low" as const,
      tvl: 3200000,
      userInvested: "845.45",
      icon: "🛡️",
      color: "from-blue-500 to-cyan-500",
      isSwapPool: true,
    },
    {
      id: "medium-risk",
      name: "Dynamic Growth Pool",
      description: "Dynamic liquidity pool with higher APY from volatile pairs.",
      apy: 18.5,
      risk: "medium" as const,
      tvl: 2100000,
      userInvested: "1000.00",
      icon: "⚡",
      color: "from-purple-500 to-pink-500",
      isSwapPool: true,
    },
  ],
}

export const CHAIN_CONFIG = {
  chainId: 1,
  chainName: "Hyperliquid",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "",
  explorerUrl: "https://explorer.hyperliquid.xyz",
  nativeCurrency: {
    name: "USDHL",
    symbol: "USDHL",
    decimals: 18,
  },
}

export const CONTRACT_ADDRESSES = {
  USDHL_TOKEN: "0x0000000000000000000000000000000000000000",
  LIQUIDITY_POOL: "0x0000000000000000000000000000000000000000",
}

export const APP_CONFIG = {
  appName: "Hyper Pool",
  description: "Simple DeFi Earnings",
  version: "0.1.0",
}