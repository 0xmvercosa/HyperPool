import { HYPERBLOOM_CONFIG, HYPEREVM_TOKENS } from '@/lib/config/chains'

export interface SwapQuote {
  inputToken: string
  outputTokens: string[]
  inputAmount: string
  outputAmounts: string[]
  ratios: number[]
  priceImpact: number
  fee: number
  estimatedGas: string
}

export interface SwapRequest {
  poolId: string
  inputToken: string
  inputAmount: string
  walletAddress: string
  slippage?: number // Default 0.5%
}

export interface SwapResponse {
  success: boolean
  txHash?: string
  error?: string
  outputAmounts?: {
    [token: string]: string
  }
}

// Mock Hyperbloom API service
class HyperbloomService {
  private apiUrl: string
  private apiKey: string

  constructor() {
    this.apiUrl = HYPERBLOOM_CONFIG.apiUrl
    this.apiKey = HYPERBLOOM_CONFIG.apiKey
  }

  // Get swap quote for pool
  async getSwapQuote(
    poolId: string,
    inputToken: string,
    inputAmount: string,
    ratios: number[] = [50, 50] // Default 50/50 split
  ): Promise<SwapQuote> {
    try {
      // API call with authentication
      const response = await fetch(`${this.apiUrl}/v1/swap/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          poolId,
          inputToken,
          inputAmount,
          ratios,
        }),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to get swap quote:', error)

      // Fallback to mock data for development
      const outputTokens = poolId === 'usdc-hype-usdt'
        ? ['HYPE', 'USDT']
        : ['TOKEN1', 'TOKEN2']

      // Calculate output amounts based on ratios
      const inputAmountNum = parseFloat(inputAmount)
      const outputAmounts = ratios.map(ratio =>
        ((inputAmountNum * ratio) / 100).toFixed(6)
      )

      return {
        inputToken,
        outputTokens,
        inputAmount,
        outputAmounts,
        ratios,
        priceImpact: 0.02, // 0.02% mock price impact
        fee: 0.003, // 0.3% fee
        estimatedGas: '0.001',
      }
    }
  }

  // Execute swap on Hyperbloom
  async executeSwap(request: SwapRequest): Promise<SwapResponse> {
    try {
      // API call with authentication
      const response = await fetch(`${this.apiUrl}/v1/swap/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `API Error: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        txHash: data.transactionHash,
        outputAmounts: data.outputAmounts,
      }
    } catch (error) {
      console.error('Swap execution failed:', error)

      // For development, return mock success after delay
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 2000))

        const outputAmounts = {
          HYPE: '0.5',
          USDT: '0.5',
        }

        return {
          success: true,
          txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
          outputAmounts,
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Get pool information
  async getPoolInfo(poolId: string) {
    // Mock pool data
    return {
      id: poolId,
      tokens: ['USDC', 'HYPE', 'USDT'],
      totalLiquidity: '1000000',
      volume24h: '50000',
      apy: 12.5,
      currentRatios: [40, 35, 25], // Current pool composition
    }
  }

  // Get token price
  async getTokenPrice(token: string): Promise<number> {
    // Mock prices
    const prices: { [key: string]: number } = {
      USDC: 1.0,
      USDT: 1.0,
      HYPE: 2.5,
    }
    return prices[token] || 0
  }

  // Validate swap parameters
  validateSwap(
    inputAmount: string,
    minOutputAmount: string = '0'
  ): { valid: boolean; error?: string } {
    const amount = parseFloat(inputAmount)

    if (isNaN(amount) || amount <= 0) {
      return { valid: false, error: 'Invalid input amount' }
    }

    if (amount < 0.01) {
      return { valid: false, error: 'Minimum swap amount is 0.01' }
    }

    if (amount > 10000) {
      return { valid: false, error: 'Maximum swap amount is 10,000' }
    }

    return { valid: true }
  }

  // Calculate slippage
  calculateSlippage(
    expectedAmount: string,
    actualAmount: string
  ): number {
    const expected = parseFloat(expectedAmount)
    const actual = parseFloat(actualAmount)

    if (expected === 0) return 0

    return Math.abs((actual - expected) / expected) * 100
  }
}

// Export singleton instance
export const hyperbloomService = new HyperbloomService()

// Export helper functions
export const formatTokenAmount = (
  amount: string,
  token: string
): string => {
  const tokenInfo = HYPEREVM_TOKENS[token as keyof typeof HYPEREVM_TOKENS]
  const decimals = tokenInfo?.decimals || 18

  // Simple formatting for display
  return parseFloat(amount).toFixed(decimals === 6 ? 2 : 4)
}

export const parseTokenAmount = (
  amount: string,
  token: string
): bigint => {
  const tokenInfo = HYPEREVM_TOKENS[token as keyof typeof HYPEREVM_TOKENS]
  const decimals = tokenInfo?.decimals || 18

  // Convert to smallest unit
  return BigInt(Math.floor(parseFloat(amount) * 10 ** decimals))
}