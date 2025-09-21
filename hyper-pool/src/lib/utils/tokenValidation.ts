import { isAddress } from 'viem'

export const SUPPORTED_TOKENS = {
  USDC: {
    address: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin'
  },
  USDT: {
    address: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
    symbol: 'USDT',
    decimals: 6,
    name: 'Tether USD'
  },
  HYPE: {
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    symbol: 'HYPE',
    decimals: 18,
    name: 'Hyperliquid',
    isNative: true
  },
  WHYPE: {
    address: '0x5555555555555555555555555555555555555555',
    symbol: 'WHYPE',
    decimals: 18,
    name: 'Wrapped Hyperliquid'
  }
}

export function validateTokenAddress(address: string): { valid: boolean; symbol?: string; error?: string } {
  if (!isAddress(address)) {
    return { valid: false, error: 'Invalid address format' }
  }

  const normalizedAddress = address.toLowerCase()

  for (const [symbol, token] of Object.entries(SUPPORTED_TOKENS)) {
    if (token.address.toLowerCase() === normalizedAddress) {
      return { valid: true, symbol }
    }
  }

  return {
    valid: false,
    error: `Token not supported. Supported tokens: ${Object.keys(SUPPORTED_TOKENS).join(', ')}`
  }
}

export function getTokenByAddress(address: string) {
  const normalizedAddress = address.toLowerCase()

  for (const token of Object.values(SUPPORTED_TOKENS)) {
    if (token.address.toLowerCase() === normalizedAddress) {
      return token
    }
  }

  return null
}

export function getTokenBySymbol(symbol: string) {
  return SUPPORTED_TOKENS[symbol as keyof typeof SUPPORTED_TOKENS] || null
}