'use client'

import { useState } from 'react'
import { TestResult } from '@/app/test-hyperbloom/page'
import { ArrowRightLeft, Loader2 } from 'lucide-react'
import { useWallet } from '@/lib/hooks/useWallet'

interface SwapSimulatorProps {
  onResult: (result: TestResult) => void
}

export function SwapSimulator({ onResult }: SwapSimulatorProps) {
  const { isConnected, address } = useWallet()
  const [testing, setTesting] = useState(false)
  const [simulationResults, setSimulationResults] = useState<any[]>([])

  const simulateSwap = async () => {
    if (!isConnected || !address) {
      onResult({
        id: 'swap-simulation',
        name: 'Swap Simulation',
        status: 'error',
        message: 'Wallet not connected'
      })
      return
    }

    setTesting(true)
    const results: any[] = []

    // Test complete swap flow
    const steps = [
      { id: 'price', name: 'Get Price Quote' },
      { id: 'quote', name: 'Get Executable Quote' },
      { id: 'allowance', name: 'Check Allowance' },
      { id: 'approve', name: 'Approve (if needed)' },
      { id: 'execute', name: 'Execute Swap' }
    ]

    for (const step of steps) {
      const testId = `swap-${step.id}`
      onResult({
        id: testId,
        name: step.name,
        status: 'running',
        message: `Testing ${step.name}...`
      })

      try {
        let result: any = { step: step.name }

        switch (step.id) {
          case 'price':
            const priceResponse = await fetch('/api/swap/price', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
                buyToken: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
                sellAmount: '1000000',
                slippagePercentage: 0.005,
                takerAddress: address
              })
            })
            result.priceData = await priceResponse.json()
            result.success = priceResponse.ok
            break

          case 'quote':
            const quoteResponse = await fetch('/api/swap/quote', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
                buyToken: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
                sellAmount: '1000000',
                slippagePercentage: 0.005,
                takerAddress: address
              })
            })
            result.quoteData = await quoteResponse.json()
            result.success = quoteResponse.ok

            // Check for allowance errors
            if (result.quoteData?.needsApproval ||
                result.quoteData?.details?.values?.message?.includes('allowance')) {
              result.needsApproval = true
            }
            break

          case 'allowance':
            // Simulated check
            result.success = true
            result.message = 'Would check allowance here'
            break

          case 'approve':
            // Simulated approval
            result.success = true
            result.message = 'Would approve token here (if needed)'
            break

          case 'execute':
            // Simulated execution
            result.success = true
            result.message = 'Would execute swap transaction here'
            break
        }

        results.push(result)
        setSimulationResults([...results])

        onResult({
          id: testId,
          name: step.name,
          status: result.success ? 'success' : 'error',
          message: result.success ? 'Step completed' : 'Step failed',
          data: result
        })
      } catch (error) {
        const result = { step: step.name, success: false, error }
        results.push(result)
        setSimulationResults([...results])

        onResult({
          id: testId,
          name: step.name,
          status: 'error',
          message: 'Step failed',
          data: result
        })
      }
    }

    setTesting(false)
  }

  const testPoolSwap = async () => {
    if (!isConnected || !address) {
      alert('Please connect wallet')
      return
    }

    setTesting(true)
    onResult({
      id: 'pool-swap-test',
      name: 'Pool Swap Test',
      status: 'running',
      message: 'Testing pool swap (USDC → WHYPE/USDT)...'
    })

    try {
      // Test getting quotes for both outputs
      const whypeQuote = await fetch('/api/swap/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
          buyToken: '0x5555555555555555555555555555555555555555',
          sellAmount: '500000', // 0.5 USDC
          slippagePercentage: 0.005,
          takerAddress: address
        })
      })

      const usdtQuote = await fetch('/api/swap/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
          buyToken: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
          sellAmount: '500000', // 0.5 USDC
          slippagePercentage: 0.005,
          takerAddress: address
        })
      })

      const whypeData = await whypeQuote.json()
      const usdtData = await usdtQuote.json()

      onResult({
        id: 'pool-swap-test',
        name: 'Pool Swap Test',
        status: whypeQuote.ok && usdtQuote.ok ? 'success' : 'error',
        message: whypeQuote.ok && usdtQuote.ok ? 'Both quotes successful' : 'One or more quotes failed',
        data: { whype: whypeData, usdt: usdtData }
      })
    } catch (error) {
      onResult({
        id: 'pool-swap-test',
        name: 'Pool Swap Test',
        status: 'error',
        message: 'Pool swap test failed',
        data: { error }
      })
    }

    setTesting(false)
  }

  return (
    <div className="card-base p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Swap Simulator</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={testPoolSwap}
            disabled={testing || !isConnected}
            className="btn-secondary px-3 py-1 text-sm"
          >
            Test Pool
          </button>
          <button
            onClick={simulateSwap}
            disabled={testing || !isConnected}
            className="btn-secondary px-3 py-1 text-sm"
          >
            {testing ? 'Simulating...' : 'Simulate'}
          </button>
        </div>
      </div>

      {!isConnected ? (
        <p className="text-xs text-muted text-center py-4">
          Connect wallet to simulate swaps
        </p>
      ) : (
        <div className="space-y-2">
          {simulationResults.map((result, index) => (
            <div key={index} className="p-2 bg-secondary rounded">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{result.step}</span>
                <span className={`text-xs ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                  {result.success ? '✓' : '✗'}
                </span>
              </div>
              {result.message && (
                <p className="text-xs text-muted mt-1">{result.message}</p>
              )}
              {result.needsApproval && (
                <p className="text-xs text-amber-500 mt-1">⚠️ Needs token approval</p>
              )}
            </div>
          ))}

          {simulationResults.length === 0 && (
            <p className="text-xs text-muted text-center py-4">
              Run simulation to test complete swap flow
            </p>
          )}
        </div>
      )}
    </div>
  )
}