'use client'

import { useState } from 'react'
import { TestResult } from '@/app/test-hyperbloom/page'
import { TrendingUp, Loader2 } from 'lucide-react'
import { formatUnits } from 'viem'

interface PriceQuoteTesterProps {
  onResult: (result: TestResult) => void
}

interface QuoteTest {
  name: string
  sellToken: string
  sellTokenSymbol: string
  buyToken: string
  buyTokenSymbol: string
  sellAmount: string
  expectedBuyAmount?: string
}

const QUOTE_TESTS: QuoteTest[] = [
  {
    name: 'USDC → WHYPE',
    sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
    sellTokenSymbol: 'USDC',
    buyToken: '0x5555555555555555555555555555555555555555',
    buyTokenSymbol: 'WHYPE',
    sellAmount: '1000000', // 1 USDC
  },
  {
    name: 'USDC → USDT',
    sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
    sellTokenSymbol: 'USDC',
    buyToken: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
    buyTokenSymbol: 'USDT',
    sellAmount: '1000000', // 1 USDC
  },
  {
    name: 'WHYPE → USDC',
    sellToken: '0x5555555555555555555555555555555555555555',
    sellTokenSymbol: 'WHYPE',
    buyToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
    buyTokenSymbol: 'USDC',
    sellAmount: '1000000000000000000', // 1 WHYPE
  }
]

export function PriceQuoteTester({ onResult }: PriceQuoteTesterProps) {
  const [testing, setTesting] = useState(false)
  const [currentTest, setCurrentTest] = useState<string>('')
  const [quoteResults, setQuoteResults] = useState<Record<string, any>>({})

  const runAllTests = async () => {
    setTesting(true)
    setQuoteResults({})

    for (const test of QUOTE_TESTS) {
      await testQuote(test)
    }

    setTesting(false)
  }

  const testQuote = async (test: QuoteTest) => {
    setCurrentTest(test.name)

    const testId = `quote-${test.name}`
    onResult({
      id: testId,
      name: `Quote: ${test.name}`,
      status: 'running',
      message: 'Getting price quote...'
    })

    try {
      const response = await fetch('/api/swap/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellToken: test.sellToken,
          buyToken: test.buyToken,
          sellAmount: test.sellAmount,
          slippagePercentage: 0.005
        })
      })

      const data = await response.json()

      if (response.ok) {
        const decimals = test.buyTokenSymbol === 'WHYPE' ? 18 : 6
        const buyAmountFormatted = formatUnits(BigInt(data.buyAmount || 0), decimals)

        const result = {
          success: true,
          price: data.price,
          buyAmount: data.buyAmount,
          buyAmountFormatted,
          estimatedPriceImpact: data.estimatedPriceImpact,
          gas: data.gas
        }

        setQuoteResults(prev => ({ ...prev, [test.name]: result }))

        onResult({
          id: testId,
          name: `Quote: ${test.name}`,
          status: 'success',
          message: `Price: ${data.price}, Output: ${buyAmountFormatted} ${test.buyTokenSymbol}`,
          data: result
        })
      } else {
        const result = {
          success: false,
          error: data.error,
          details: data.details
        }

        setQuoteResults(prev => ({ ...prev, [test.name]: result }))

        onResult({
          id: testId,
          name: `Quote: ${test.name}`,
          status: 'error',
          message: data.error || 'Failed to get quote',
          data: result
        })
      }
    } catch (error) {
      const result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      setQuoteResults(prev => ({ ...prev, [test.name]: result }))

      onResult({
        id: testId,
        name: `Quote: ${test.name}`,
        status: 'error',
        message: 'Failed to fetch quote',
        data: result
      })
    }

    setCurrentTest('')
  }

  const testCustomQuote = async () => {
    const sellToken = (document.getElementById('sell-token') as HTMLInputElement)?.value
    const buyToken = (document.getElementById('buy-token') as HTMLInputElement)?.value
    const sellAmount = (document.getElementById('sell-amount') as HTMLInputElement)?.value

    if (!sellToken || !buyToken || !sellAmount) {
      alert('Please fill all fields')
      return
    }

    await testQuote({
      name: 'Custom',
      sellToken,
      sellTokenSymbol: 'CUSTOM',
      buyToken,
      buyTokenSymbol: 'CUSTOM',
      sellAmount
    })
  }

  return (
    <div className="card-base p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Price Quote Tester</h3>
        </div>
        <button
          onClick={runAllTests}
          disabled={testing}
          className="btn-secondary px-3 py-1 text-sm"
        >
          {testing ? 'Testing...' : 'Test All'}
        </button>
      </div>

      {/* Predefined Tests */}
      <div className="space-y-2 mb-4">
        {QUOTE_TESTS.map(test => {
          const result = quoteResults[test.name]
          return (
            <div key={test.name} className="p-2 bg-secondary rounded">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{test.name}</span>
                  {currentTest === test.name && (
                    <Loader2 className="w-3 h-3 animate-spin inline ml-2" />
                  )}
                </div>
                <button
                  onClick={() => testQuote(test)}
                  disabled={testing}
                  className="text-xs text-primary hover:underline"
                >
                  Test
                </button>
              </div>
              {result && (
                <div className="mt-1 text-xs text-muted">
                  {result.success ? (
                    <>
                      Price: {result.price} | Output: {result.buyAmountFormatted}
                    </>
                  ) : (
                    <>Error: {result.error}</>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Custom Test */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-2">Custom Quote Test</h4>
        <div className="space-y-2">
          <input
            id="sell-token"
            placeholder="Sell Token Address"
            className="w-full px-2 py-1 text-xs bg-secondary rounded"
          />
          <input
            id="buy-token"
            placeholder="Buy Token Address"
            className="w-full px-2 py-1 text-xs bg-secondary rounded"
          />
          <input
            id="sell-amount"
            placeholder="Sell Amount (in smallest unit)"
            className="w-full px-2 py-1 text-xs bg-secondary rounded"
          />
          <button
            onClick={testCustomQuote}
            disabled={testing}
            className="btn-secondary w-full py-1 text-xs"
          >
            Test Custom Quote
          </button>
        </div>
      </div>
    </div>
  )
}