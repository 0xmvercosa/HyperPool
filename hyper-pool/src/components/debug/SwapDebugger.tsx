'use client'

import { useState } from 'react'
import { useWallet } from '@/lib/hooks/useWallet'
import { formatUnits } from 'viem'

interface TokenTest {
  name: string
  sellToken: string
  buyToken: string
  sellAmount: string
  expectedOutput?: string
}

const TOKEN_TESTS: TokenTest[] = [
  {
    name: 'USDC → WHYPE',
    sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
    buyToken: '0x5555555555555555555555555555555555555555',
    sellAmount: '1000000', // 1 USDC
    expectedOutput: '~0.4 WHYPE'
  },
  {
    name: 'USDC → USDT',
    sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
    buyToken: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
    sellAmount: '1000000', // 1 USDC
    expectedOutput: '~1 USDT'
  },
  {
    name: 'WHYPE → USDC',
    sellToken: '0x5555555555555555555555555555555555555555',
    buyToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
    sellAmount: '400000000000000000', // 0.4 WHYPE
    expectedOutput: '~1 USDC'
  },
  {
    name: 'USDT → WHYPE',
    sellToken: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
    buyToken: '0x5555555555555555555555555555555555555555',
    sellAmount: '1000000', // 1 USDT
    expectedOutput: '~0.4 WHYPE'
  }
]

export function SwapDebugger() {
  const { isConnected, address } = useWallet()
  const [results, setResults] = useState<Record<string, any>>({})
  const [testing, setTesting] = useState(false)

  const testSwap = async (test: TokenTest) => {
    setTesting(true)
    try {
      const response = await fetch('/api/swap/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellToken: test.sellToken,
          buyToken: test.buyToken,
          sellAmount: test.sellAmount,
          slippagePercentage: 0.005,
          takerAddress: address
        })
      })

      const data = await response.json()

      setResults(prev => ({
        ...prev,
        [test.name]: response.ok ? {
          success: true,
          data,
          buyAmount: data.buyAmount,
          price: data.price
        } : {
          success: false,
          error: data.error,
          details: data.details
        }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [test.name]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    } finally {
      setTesting(false)
    }
  }

  const testAllSwaps = async () => {
    for (const test of TOKEN_TESTS) {
      await testSwap(test)
      await new Promise(resolve => setTimeout(resolve, 500)) // Rate limit
    }
  }

  const testSources = async () => {
    try {
      const response = await fetch('/api/swap/sources')
      const data = await response.json()
      setResults(prev => ({
        ...prev,
        sources: response.ok ? { success: true, data } : { success: false, error: data }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        sources: { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }))
    }
  }

  if (!isConnected) {
    return (
      <div className="card-base p-4">
        <p className="text-muted">Connect wallet to test swaps</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="card-base p-4">
        <h3 className="font-semibold mb-4">Swap API Debugger</h3>

        <div className="flex gap-2 mb-4">
          <button
            onClick={testSources}
            className="btn-primary px-4 py-2 text-sm"
            disabled={testing}
          >
            Test Sources
          </button>
          <button
            onClick={testAllSwaps}
            className="btn-primary px-4 py-2 text-sm"
            disabled={testing}
          >
            Test All Swaps
          </button>
        </div>

        <div className="space-y-2">
          {TOKEN_TESTS.map(test => (
            <div key={test.name} className="flex items-center justify-between p-2 bg-gray-900 rounded">
              <div className="flex-1">
                <span className="text-sm">{test.name}</span>
                <span className="text-xs text-muted ml-2">{test.expectedOutput}</span>
              </div>
              <button
                onClick={() => testSwap(test)}
                className="btn-secondary px-3 py-1 text-xs"
                disabled={testing}
              >
                Test
              </button>
              {results[test.name] && (
                <div className="ml-2">
                  {results[test.name].success ? (
                    <span className="text-xs text-green-500">✓</span>
                  ) : (
                    <span className="text-xs text-red-500">✗</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="card-base p-4">
          <h4 className="font-semibold mb-2">Results</h4>
          <pre className="text-xs overflow-auto max-h-96 bg-gray-900 p-2 rounded">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}