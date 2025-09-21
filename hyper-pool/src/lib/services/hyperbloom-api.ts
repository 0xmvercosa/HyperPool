import tokensConfig from '@/config/tokens.json'
import { validateTokenAddress, getTokenBySymbol, SUPPORTED_TOKENS } from '@/lib/utils/tokenValidation'

export interface PriceQuote {
  chainId: number
  price: string
  estimatedPriceImpact: string
  value: string
  gasPrice: string
  gas: string
  estimatedGas: string
  protocolFee: string
  minimumProtocolFee: string
  buyTokenAddress: string
  buyAmount: string
  sellTokenAddress: string
  sellAmount: string
  allowanceTarget: string
  sellTokenToEthRate: string
  buyTokenToEthRate: string
  expectedSlippage: string | null
}

export interface SwapQuote extends PriceQuote {
  to: string
  data: string
  guaranteedPrice: string
}

export interface PoolSwapQuote {
  poolId: string
  inputToken: string
  inputAmount: string
  outputTokens: string[]
  outputAmounts: string[]
  minOutputAmounts: string[]
  ratios: number[]
  totalPriceImpact: number
  totalGas: string
  quotes: PriceQuote[]
}

class HyperBloomAPI {
  private apiUrl: string
  private apiKey: string
  private tokens: typeof tokensConfig.hyperEVM.tokens
  private pools: typeof tokensConfig.hyperEVM.pools

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_HYPERBLOOM_API_URL || 'https://api.hyperbloom.xyz'
    this.apiKey = process.env.NEXT_PUBLIC_HYPERBLOOM_API_KEY || ''
    this.tokens = tokensConfig.hyperEVM.tokens
    this.pools = tokensConfig.hyperEVM.pools
  }

  // Get token address by symbol with validation
  private getTokenAddress(symbol: string): string {
    const token = getTokenBySymbol(symbol) || this.tokens[symbol as keyof typeof this.tokens]
    if (!token) {
      throw new Error(`Token ${symbol} not found. Supported: ${Object.keys(SUPPORTED_TOKENS).join(', ')}`)
    }

    // Validate the address
    const validation = validateTokenAddress(token.address)
    if (!validation.valid) {
      throw new Error(`Invalid token address for ${symbol}: ${validation.error}`)
    }

    return token.address
  }

  // Get pool configuration
  private getPoolConfig(poolId: string) {
    // Try to find pool by converting poolId to uppercase key format
    const poolKey = poolId.toUpperCase().replace(/-/g, '-')
    const pool = this.pools[poolKey as keyof typeof this.pools] ||
                 Object.values(this.pools).find(p => p.id === poolId)

    console.log('[HyperBloom] Looking for pool:', {
      poolId,
      poolKey,
      availablePools: Object.keys(this.pools),
      found: !!pool
    })

    if (!pool) {
      throw new Error(`Pool ${poolId} not found in configuration. Available: ${Object.keys(this.pools).join(', ')}`)
    }
    return pool
  }

  // Get price quote for a single swap
  async getPriceQuote(
    sellToken: string,
    buyToken: string,
    sellAmount: string,
    slippagePercentage: number = 0.005,
    takerAddress?: string
  ): Promise<PriceQuote> {
    try {
      const sellTokenAddress = this.getTokenAddress(sellToken)
      const buyTokenAddress = this.getTokenAddress(buyToken)

      // Convert amount to base units
      const sellTokenDecimals = this.tokens[sellToken as keyof typeof this.tokens].decimals
      const sellAmountBase = BigInt(Math.floor(parseFloat(sellAmount) * (10 ** sellTokenDecimals))).toString()

      console.log('[HyperBloom Service] Getting price quote:', {
        sellToken: `${sellToken} (${sellTokenAddress})`,
        buyToken: `${buyToken} (${buyTokenAddress})`,
        sellAmount,
        sellAmountBase,
        slippagePercentage,
        takerAddress
      })

      // Use Next.js API route to avoid CORS issues
      const response = await fetch('/api/swap/price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sellToken: sellTokenAddress,
          buyToken: buyTokenAddress,
          sellAmount: sellAmountBase,
          slippagePercentage,
          takerAddress
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        console.error('[HyperBloom Service] Price quote error:', error)
        throw new Error(error.error || error.message || `API Error: ${response.status}`)
      }

      const data = await response.json()
      console.log('[HyperBloom Service] Price quote success')
      return data
    } catch (error) {
      console.error('Failed to get price quote:', error)
      // Return mock data for development
      return this.getMockPriceQuote(sellToken, buyToken, sellAmount)
    }
  }

  // Get price quotes for pool swap (multiple output tokens)
  async getPoolSwapQuote(
    poolId: string,
    inputAmount: string,
    ratios?: number[],
    slippagePercentage: number = 0.005,
    takerAddress?: string
  ): Promise<PoolSwapQuote> {
    try {
      const poolConfig = this.getPoolConfig(poolId)
      const finalRatios = ratios || poolConfig.defaultRatio

      // Validate ratios sum to 100
      const ratioSum = finalRatios.reduce((sum, r) => sum + r, 0)
      if (Math.abs(ratioSum - 100) > 0.01) {
        throw new Error(`Ratios must sum to 100, got ${ratioSum}`)
      }

      // Get quotes for each output token
      const quotes = await Promise.all(
        poolConfig.outputTokens.map(async (outputToken, index) => {
          const ratio = finalRatios[index]
          const proportionalAmount = (parseFloat(inputAmount) * ratio / 100).toString()

          return this.getPriceQuote(
            poolConfig.inputToken,
            outputToken,
            proportionalAmount,
            slippagePercentage,
            takerAddress
          )
        })
      )

      // Calculate min output amounts (with slippage)
      const minOutputAmounts = quotes.map(quote => {
        const buyAmount = BigInt(quote.buyAmount)
        const slippageAmount = buyAmount * BigInt(Math.floor(slippagePercentage * 10000)) / BigInt(10000)
        return (buyAmount - slippageAmount).toString()
      })

      // Aggregate results
      return {
        poolId,
        inputToken: poolConfig.inputToken,
        inputAmount,
        outputTokens: poolConfig.outputTokens,
        outputAmounts: quotes.map(q => q.buyAmount),
        minOutputAmounts,
        ratios: finalRatios,
        totalPriceImpact: Math.max(...quotes.map(q => parseFloat(q.estimatedPriceImpact || '0'))),
        totalGas: quotes.reduce((sum, q) => (BigInt(sum) + BigInt(q.gas)).toString(), '0'),
        quotes
      }
    } catch (error) {
      console.error('Failed to get pool swap quote:', error)
      throw error
    }
  }

  // Get executable swap quote
  async getSwapQuote(
    sellToken: string,
    buyToken: string,
    sellAmount: string,
    takerAddress: string,
    slippagePercentage: number = 0.005
  ): Promise<SwapQuote> {
    try {
      const sellTokenAddress = this.getTokenAddress(sellToken)
      const buyTokenAddress = this.getTokenAddress(buyToken)

      // Convert amount to base units
      const sellTokenDecimals = this.tokens[sellToken as keyof typeof this.tokens].decimals
      const sellAmountBase = BigInt(Math.floor(parseFloat(sellAmount) * (10 ** sellTokenDecimals))).toString()

      console.log('[HyperBloom Service] Getting swap quote:', {
        sellToken: `${sellToken} (${sellTokenAddress})`,
        buyToken: `${buyToken} (${buyTokenAddress})`,
        sellAmount,
        sellAmountBase,
        slippagePercentage,
        takerAddress
      })

      // Use Next.js API route to avoid CORS issues
      const response = await fetch('/api/swap/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sellToken: sellTokenAddress,
          buyToken: buyTokenAddress,
          sellAmount: sellAmountBase,
          slippagePercentage,
          takerAddress
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        console.error('[HyperBloom Service] Swap quote error:', error)
        throw new Error(error.error || error.message || `API Error: ${response.status}`)
      }

      const data = await response.json()
      console.log('[HyperBloom Service] Swap quote success:', {
        to: data.to,
        value: data.value,
        gas: data.gas
      })
      return data
    } catch (error) {
      console.error('Failed to get swap quote:', error)
      throw error
    }
  }

  // Execute pool swap (returns transaction data for each swap)
  async getPoolSwapTransactions(
    poolId: string,
    inputAmount: string,
    takerAddress: string,
    ratios?: number[],
    slippagePercentage: number = 0.005
  ): Promise<SwapQuote[]> {
    try {
      const poolConfig = this.getPoolConfig(poolId)
      const finalRatios = ratios || poolConfig.defaultRatio

      console.log('[HyperBloom] Getting pool swap transactions:', {
        poolId,
        poolConfig,
        inputToken: poolConfig.inputToken,
        inputAmount,
        takerAddress,
        ratios: finalRatios
      })

      // Get executable quotes for each output token
      const swapQuotes = await Promise.all(
        poolConfig.outputTokens.map(async (outputToken, index) => {
          const ratio = finalRatios[index]
          const proportionalAmount = (parseFloat(inputAmount) * ratio / 100).toString()

          console.log(`[HyperBloom] Getting swap quote ${index + 1}:`, {
            from: poolConfig.inputToken,
            to: outputToken,
            amount: proportionalAmount,
            ratio: `${ratio}%`
          })

          return this.getSwapQuote(
            poolConfig.inputToken,
            outputToken,
            proportionalAmount,
            takerAddress,
            slippagePercentage
          )
        })
      )

      console.log('[HyperBloom] All swap quotes received:', {
        count: swapQuotes.length,
        allowanceTargets: swapQuotes.map(q => q.allowanceTarget),
        totalValue: swapQuotes.reduce((sum, q) => sum + BigInt(q.value), 0n).toString()
      })

      return swapQuotes
    } catch (error) {
      console.error('Failed to get pool swap transactions:', error)
      throw error
    }
  }

  // Format token amount for display
  formatTokenAmount(amount: string, tokenSymbol: string): string {
    const token = this.tokens[tokenSymbol as keyof typeof this.tokens]
    if (!token) return '0'

    const decimals = token.decimals
    const value = BigInt(amount) / BigInt(10 ** decimals)
    const remainder = BigInt(amount) % BigInt(10 ** decimals)

    // Format with up to 6 decimal places
    const decimalPart = remainder.toString().padStart(decimals, '0').slice(0, 6)
    return `${value}.${decimalPart}`.replace(/\.?0+$/, '')
  }

  // Mock data for development
  private getMockPriceQuote(sellToken: string, buyToken: string, sellAmount: string): PriceQuote {
    const mockPrices: Record<string, number> = {
      'USDC': 1,
      'USDT': 0.999,
      'HYPE': 2.5,
      'WETH': 3500,
      'WBTC': 65000
    }

    const sellPrice = mockPrices[sellToken] || 1
    const buyPrice = mockPrices[buyToken] || 1
    const exchangeRate = sellPrice / buyPrice

    const sellTokenData = this.tokens[sellToken as keyof typeof this.tokens]
    const buyTokenData = this.tokens[buyToken as keyof typeof this.tokens]

    const buyAmountFloat = parseFloat(sellAmount) * exchangeRate
    const buyAmountBase = BigInt(Math.floor(buyAmountFloat * (10 ** buyTokenData.decimals))).toString()
    const sellAmountBase = BigInt(Math.floor(parseFloat(sellAmount) * (10 ** sellTokenData.decimals))).toString()

    return {
      chainId: 999,
      price: exchangeRate.toString(),
      estimatedPriceImpact: '0.02',
      value: '0',
      gasPrice: '47500000',
      gas: '200000',
      estimatedGas: '180000',
      protocolFee: '0',
      minimumProtocolFee: '0',
      buyTokenAddress: buyTokenData.address,
      buyAmount: buyAmountBase,
      sellTokenAddress: sellTokenData.address,
      sellAmount: sellAmountBase,
      allowanceTarget: '0x0000000000000000000000000000000000000000',
      sellTokenToEthRate: '1',
      buyTokenToEthRate: exchangeRate.toString(),
      expectedSlippage: null
    }
  }
}

export const hyperbloomAPI = new HyperBloomAPI()

// Re-export formatted amount function for backward compatibility
export const formatTokenAmount = (amount: string, token: string) =>
  hyperbloomAPI.formatTokenAmount(amount, token)