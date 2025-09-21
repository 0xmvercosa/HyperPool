'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, Copy } from 'lucide-react'

export function USDCDebugger() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runUSDCTests = async () => {
    setTesting(true)
    setResults(null)

    const tests = []

    // Test 1: USDC -> HYPE (native)
    console.log('[USDCDebugger] Test 1: USDC -> HYPE')
    const test1 = await fetch('/api/swap/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
        buyToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        sellAmount: '1000000',
        slippagePercentage: 0.005
      })
    })

    const test1Data = await test1.json()
    tests.push({
      name: 'USDC -> HYPE',
      success: test1.ok,
      status: test1.status,
      data: test1Data,
      request: {
        sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
        buyToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        sellAmount: '1000000'
      }
    })

    // Test 2: HYPE -> USDC
    console.log('[USDCDebugger] Test 2: HYPE -> USDC')
    const test2 = await fetch('/api/swap/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        buyToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
        sellAmount: '1000000000000000000',
        slippagePercentage: 0.005
      })
    })

    const test2Data = await test2.json()
    tests.push({
      name: 'HYPE -> USDC',
      success: test2.ok,
      status: test2.status,
      data: test2Data,
      request: {
        sellToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        buyToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
        sellAmount: '1000000000000000000'
      }
    })

    // Test 3: USDC -> WHYPE
    console.log('[USDCDebugger] Test 3: USDC -> WHYPE')
    const test3 = await fetch('/api/swap/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
        buyToken: '0x5555555555555555555555555555555555555555',
        sellAmount: '1000000',
        slippagePercentage: 0.005
      })
    })

    const test3Data = await test3.json()
    tests.push({
      name: 'USDC -> WHYPE',
      success: test3.ok,
      status: test3.status,
      data: test3Data,
      request: {
        sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
        buyToken: '0x5555555555555555555555555555555555555555',
        sellAmount: '1000000'
      }
    })

    // Test 4: USDC -> USDT
    console.log('[USDCDebugger] Test 4: USDC -> USDT')
    const test4 = await fetch('/api/swap/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
        buyToken: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
        sellAmount: '1000000',
        slippagePercentage: 0.005
      })
    })

    const test4Data = await test4.json()
    tests.push({
      name: 'USDC -> USDT',
      success: test4.ok,
      status: test4.status,
      data: test4Data,
      request: {
        sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
        buyToken: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
        sellAmount: '1000000'
      }
    })

    // Test 5: Test with lowercase address
    console.log('[USDCDebugger] Test 5: USDC (lowercase) -> HYPE')
    const test5 = await fetch('/api/swap/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellToken: '0xb88339cb7199b77e23db6e890353e22632ba630f'.toLowerCase(),
        buyToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        sellAmount: '1000000',
        slippagePercentage: 0.005
      })
    })

    const test5Data = await test5.json()
    tests.push({
      name: 'USDC (lowercase) -> HYPE',
      success: test5.ok,
      status: test5.status,
      data: test5Data,
      request: {
        sellToken: '0xb88339cb7199b77e23db6e890353e22632ba630f'.toLowerCase(),
        buyToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        sellAmount: '1000000'
      }
    })

    setResults({
      tests,
      summary: {
        total: tests.length,
        successful: tests.filter(t => t.success).length,
        failed: tests.filter(t => !t.success).length
      }
    })

    setTesting(false)
  }

  const copyResults = () => {
    if (results) {
      navigator.clipboard.writeText(JSON.stringify(results, null, 2))
      alert('Results copied to clipboard!')
    }
  }

  return (
    <div className="card-base p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold">USDC Debugger</h2>
        </div>
        <button
          onClick={runUSDCTests}
          disabled={testing}
          className="btn-primary px-4 py-2"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Testing...
            </>
          ) : (
            'Run USDC Tests'
          )}
        </button>
      </div>

      <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded">
        <p className="text-sm text-amber-500 mb-2">
          This debugger will test USDC with different configurations to identify the exact error.
        </p>
        <p className="text-xs text-muted">
          Check the browser console for detailed logs.
        </p>
      </div>

      {results && (
        <>
          {/* Summary */}
          <div className="mb-4 p-3 bg-secondary rounded">
            <div className="text-sm font-semibold mb-1">Test Summary:</div>
            <div className="text-xs space-y-1">
              <div>Total Tests: {results.summary.total}</div>
              <div className="text-green-500">✓ Successful: {results.summary.successful}</div>
              <div className="text-red-500">✗ Failed: {results.summary.failed}</div>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-3">
            {results.tests.map((test: any, index: number) => (
              <div
                key={index}
                className={`p-3 rounded border ${
                  test.success
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{test.name}</span>
                  <span className={`text-sm ${test.success ? 'text-green-500' : 'text-red-500'}`}>
                    Status: {test.status}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div className="font-mono bg-black/20 p-2 rounded">
                    <div>From: {test.request.sellToken.slice(0, 10)}...{test.request.sellToken.slice(-6)}</div>
                    <div>To: {test.request.buyToken.slice(0, 10)}...{test.request.buyToken.slice(-6)}</div>
                    <div>Amount: {test.request.sellAmount}</div>
                  </div>

                  {!test.success && test.data && (
                    <div className="mt-2 p-2 bg-red-900/20 rounded">
                      <div className="font-semibold text-red-400 mb-1">Error Details:</div>
                      <div>Error: {test.data.error}</div>
                      {test.data.details?.code && (
                        <div>Code: {test.data.details.code}</div>
                      )}
                      {test.data.details?.reason && (
                        <div>Reason: {test.data.details.reason}</div>
                      )}
                      {test.data.details?.validationErrors && (
                        <div>
                          Validation Errors:
                          {test.data.details.validationErrors.map((e: any, i: number) => (
                            <div key={i} className="ml-2">
                              - {e.field}: {e.reason} (code: {e.code})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {test.success && test.data && (
                    <div className="mt-2 p-2 bg-green-900/20 rounded">
                      <div className="font-semibold text-green-400 mb-1">Success:</div>
                      <div>Price: {test.data.price}</div>
                      <div>Buy Amount: {test.data.buyAmount}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Copy Results Button */}
          <button
            onClick={copyResults}
            className="mt-4 btn-secondary w-full py-2 flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Full Results to Clipboard
          </button>

          {/* Full JSON Results */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted hover:text-primary">
              Show Full JSON Results
            </summary>
            <pre className="mt-2 p-3 bg-black/40 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  )
}