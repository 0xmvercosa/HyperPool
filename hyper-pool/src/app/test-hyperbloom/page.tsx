'use client'

import { useState } from 'react'
import { ConnectionTest } from '@/components/test/ConnectionTest'
import { TokenValidator } from '@/components/test/TokenValidator'
import { TokenScanner } from '@/components/test/TokenScanner'
import { USDCDebugger } from '@/components/test/USDCDebugger'
import { PriceQuoteTester } from '@/components/test/PriceQuoteTester'
import { ApprovalTester } from '@/components/test/ApprovalTester'
import { SwapSimulator } from '@/components/test/SwapSimulator'
import { ResultsDashboard } from '@/components/test/ResultsDashboard'
import { ConfigExporter } from '@/components/test/ConfigExporter'
import { useWallet } from '@/lib/hooks/useWallet'
import { WalletConnect } from '@/components/wallet/WalletConnect'

export interface TestResult {
  id: string
  name: string
  status: 'pending' | 'running' | 'success' | 'error' | 'warning'
  message?: string
  data?: any
  timestamp?: number
}

export default function TestHyperBloom() {
  const { isConnected } = useWallet()
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (result: TestResult) => {
    setResults(prev => {
      const existing = prev.findIndex(r => r.id === result.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { ...result, timestamp: Date.now() }
        return updated
      }
      return [...prev, { ...result, timestamp: Date.now() }]
    })
  }

  const clearResults = () => {
    setResults([])
  }

  const runAllTests = async () => {
    setIsRunning(true)
    clearResults()

    // Tests will be triggered by child components
    // Each component will update results independently

    setIsRunning(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">HyperBloom API Test Suite</h1>
          <p className="text-muted">Comprehensive testing and diagnostics for HyperBloom integration</p>
        </div>

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="card-base p-6 mb-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Connect Wallet to Start Testing</h2>
            <p className="text-muted mb-4">Some tests require a connected wallet</p>
            <WalletConnect />
          </div>
        )}

        {/* Control Panel */}
        <div className="card-base p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className="btn-primary px-4 py-2"
              >
                {isRunning ? 'Running Tests...' : 'Run All Tests'}
              </button>
              <button
                onClick={clearResults}
                className="btn-secondary px-4 py-2"
              >
                Clear Results
              </button>
            </div>
            <div className="text-sm text-muted">
              {results.length > 0 && (
                <span>
                  {results.filter(r => r.status === 'success').length} passed,
                  {' ' + results.filter(r => r.status === 'error').length} failed,
                  {' ' + results.filter(r => r.status === 'warning').length} warnings
                </span>
              )}
            </div>
          </div>
        </div>

        {/* USDC Debugger - Full Width */}
        <div className="mb-6">
          <USDCDebugger />
        </div>

        {/* Token Scanner - Full Width */}
        <div className="mb-6">
          <TokenScanner />
        </div>

        {/* Test Components Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ConnectionTest onResult={addResult} />
          <TokenValidator onResult={addResult} />
          <PriceQuoteTester onResult={addResult} />
          <ApprovalTester onResult={addResult} />
          <SwapSimulator onResult={addResult} />
          <ConfigExporter results={results} />
        </div>

        {/* Results Dashboard */}
        <ResultsDashboard results={results} />
      </div>
    </div>
  )
}