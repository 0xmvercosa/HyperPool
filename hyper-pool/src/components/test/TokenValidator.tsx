'use client'

import { useState } from 'react'
import { TestResult } from '@/app/test-hyperbloom/page'
import { CheckCircle, XCircle, AlertCircle, Loader2, Coins } from 'lucide-react'
import tokensConfig from '@/config/tokens.json'

interface TokenTestResult {
  token: string
  address: string
  status: 'success' | 'error' | 'warning'
  message: string
  data?: any
}

interface TokenValidatorProps {
  onResult: (result: TestResult) => void
}

export function TokenValidator({ onResult }: TokenValidatorProps) {
  const [testing, setTesting] = useState(false)
  const [tokenResults, setTokenResults] = useState<TokenTestResult[]>([])

  const tokens = Object.entries(tokensConfig.hyperEVM.tokens)

  const runTests = async () => {
    setTesting(true)
    setTokenResults([])

    const results: TokenTestResult[] = []

    for (const [symbol, token] of tokens) {
      const result = await testToken(symbol, token.address)
      results.push(result)
      setTokenResults([...results])
    }

    // Report overall result
    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    onResult({
      id: 'token-validation',
      name: 'Token Validation',
      status: errorCount === 0 ? 'success' : errorCount === results.length ? 'error' : 'warning',
      message: `${successCount}/${results.length} tokens validated successfully`,
      data: results
    })

    setTesting(false)
  }

  const testToken = async (symbol: string, address: string): Promise<TokenTestResult> => {
    try {
      // Skip native token and placeholder addresses
      if (address === '0x0000000000000000000000000000000000000000') {
        return {
          token: symbol,
          address,
          status: 'warning',
          message: 'Placeholder address',
          data: { isPlaceholder: true }
        }
      }

      // Use HYPE as base token to avoid USDC->USDC issue
      const HYPE_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

      // Test bidirectionally: HYPE -> Token and Token -> HYPE
      const test1Response = await fetch('/api/swap/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellToken: HYPE_ADDRESS, // HYPE as base
          buyToken: address,
          sellAmount: '1000000000000000000', // 1 HYPE (18 decimals)
          slippagePercentage: 0.005
        })
      })

      const test1Data = await test1Response.json()

      // Test reverse direction: Token -> HYPE
      const decimals = symbol === 'USDC' || symbol === 'USDT' ? 6 : 18
      const sellAmount = decimals === 6 ? '1000000' : '1000000000000000000'

      const test2Response = await fetch('/api/swap/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellToken: address,
          buyToken: HYPE_ADDRESS,
          sellAmount,
          slippagePercentage: 0.005
        })
      })

      const test2Data = await test2Response.json()

      // Check if token works in at least one direction
      const worksAsTarget = test1Response.ok && !test1Data.error
      const worksAsSource = test2Response.ok && !test2Data.error

      if (worksAsTarget || worksAsSource) {
        let direction = ''
        if (worksAsTarget && worksAsSource) {
          direction = 'bidirectional'
        } else if (worksAsTarget) {
          direction = 'as buy token only'
        } else {
          direction = 'as sell token only'
        }

        return {
          token: symbol,
          address,
          status: 'success',
          message: `Token is supported (${direction})`,
          data: {
            hypeToToken: test1Data,
            tokenToHype: test2Data,
            worksAsTarget,
            worksAsSource,
            direction
          }
        }
      } else {
        // Log detailed error for debugging
        console.error(`[TokenValidator] ${symbol} test failed:`, {
          test1: { status: test1Response.status, data: test1Data },
          test2: { status: test2Response.status, data: test2Data }
        })

        // Combine error messages from both tests
        const errors = []
        if (test1Data.error) errors.push(`HYPE→${symbol}: ${test1Data.error}`)
        if (test2Data.error) errors.push(`${symbol}→HYPE: ${test2Data.error}`)

        // Check if it's a specific token not found error
        const tokenNotFound =
          test1Data.details?.validationErrors?.some((e: any) => e.reason === 'Token not found') ||
          test2Data.details?.validationErrors?.some((e: any) => e.reason === 'Token not found')

        if (tokenNotFound) {
          return {
            token: symbol,
            address,
            status: 'error',
            message: 'Token not found in HyperBloom',
            data: { test1Data, test2Data }
          }
        }

        return {
          token: symbol,
          address,
          status: 'error',
          message: errors.join(' | ') || 'Failed both directions',
          data: { test1Data, test2Data }
        }
      }
    } catch (error) {
      return {
        token: symbol,
        address,
        status: 'error',
        message: 'Test failed',
        data: { error }
      }
    }
  }

  const testSingleToken = async (symbol: string, address: string) => {
    setTesting(true)
    const result = await testToken(symbol, address)
    setTokenResults(prev => {
      const existing = prev.findIndex(r => r.token === symbol)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = result
        return updated
      }
      return [...prev, result]
    })
    setTesting(false)
  }

  const getStatusIcon = (status: TokenTestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
  }

  const discoverWorkingPairs = async () => {
    setTesting(true)

    // Test common token addresses that might work
    const commonTokens = [
      { symbol: 'HYPE', address: '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE' },
      { symbol: 'HYPE2', address: '0x2222222222222222222222222222222222222222' },
      { symbol: 'WHYPE', address: '0x5555555555555555555555555555555555555555' },
      { symbol: 'USDT', address: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb' },
    ]

    const workingTokens: any[] = []

    for (const token of commonTokens) {
      const result = await testToken(token.symbol, token.address)
      if (result.status === 'success') {
        workingTokens.push(token)
      }
    }

    onResult({
      id: 'token-discovery',
      name: 'Token Discovery',
      status: workingTokens.length > 0 ? 'success' : 'error',
      message: `Found ${workingTokens.length} working tokens`,
      data: workingTokens
    })

    setTesting(false)
  }

  return (
    <div className="card-base p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Token Validator</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={discoverWorkingPairs}
            disabled={testing}
            className="btn-secondary px-3 py-1 text-sm"
          >
            Discover
          </button>
          <button
            onClick={runTests}
            disabled={testing}
            className="btn-secondary px-3 py-1 text-sm"
          >
            {testing ? 'Testing...' : 'Validate All'}
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {tokens.map(([symbol, token]) => {
          const result = tokenResults.find(r => r.token === symbol)
          return (
            <div key={symbol} className="flex items-center justify-between p-2 bg-secondary rounded">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{symbol}</span>
                  <span className="text-xs text-muted">{token.address.slice(0, 6)}...{token.address.slice(-4)}</span>
                </div>
                {result && (
                  <span className="text-xs text-muted">{result.message}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => testSingleToken(symbol, token.address)}
                  disabled={testing}
                  className="text-xs text-primary hover:underline"
                >
                  Test
                </button>
                {result && getStatusIcon(result.status)}
              </div>
            </div>
          )
        })}
      </div>

      {tokenResults.length > 0 && (
        <div className="mt-4 p-2 bg-secondary rounded text-xs">
          <div>✅ Working: {tokenResults.filter(r => r.status === 'success').map(r => r.token).join(', ') || 'None'}</div>
          <div>❌ Failed: {tokenResults.filter(r => r.status === 'error').map(r => r.token).join(', ') || 'None'}</div>
        </div>
      )}
    </div>
  )
}