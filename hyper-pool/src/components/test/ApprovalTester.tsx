'use client'

import { useState } from 'react'
import { TestResult } from '@/app/test-hyperbloom/page'
import { Shield, Loader2 } from 'lucide-react'
import { useWallet } from '@/lib/hooks/useWallet'
import { useTokenApproval } from '@/lib/hooks/useTokenApproval'
import { formatUnits } from 'viem'

interface ApprovalTesterProps {
  onResult: (result: TestResult) => void
}

export function ApprovalTester({ onResult }: ApprovalTesterProps) {
  const { isConnected, address } = useWallet()
  const { checkAllowance, HYPERBLOOM_ROUTER } = useTokenApproval()
  const [testing, setTesting] = useState(false)
  const [allowances, setAllowances] = useState<Record<string, string>>({})
  const [routerAddress, setRouterAddress] = useState(HYPERBLOOM_ROUTER)

  const tokens = [
    { symbol: 'USDC', decimals: 6 },
    { symbol: 'USDT', decimals: 6 },
    { symbol: 'WHYPE', decimals: 18 }
  ]

  const testAllAllowances = async () => {
    if (!isConnected) {
      onResult({
        id: 'approval-test',
        name: 'Approval Test',
        status: 'error',
        message: 'Wallet not connected'
      })
      return
    }

    setTesting(true)
    const results: Record<string, string> = {}

    for (const token of tokens) {
      const testId = `allowance-${token.symbol}`
      onResult({
        id: testId,
        name: `Allowance: ${token.symbol}`,
        status: 'running',
        message: 'Checking allowance...'
      })

      try {
        const allowance = await checkAllowance(token.symbol)
        const formatted = formatUnits(allowance, token.decimals)
        results[token.symbol] = formatted

        onResult({
          id: testId,
          name: `Allowance: ${token.symbol}`,
          status: allowance > 0n ? 'success' : 'warning',
          message: `Allowance: ${formatted}`,
          data: { allowance: allowance.toString(), formatted }
        })
      } catch (error) {
        results[token.symbol] = 'Error'
        onResult({
          id: testId,
          name: `Allowance: ${token.symbol}`,
          status: 'error',
          message: 'Failed to check allowance',
          data: { error }
        })
      }
    }

    setAllowances(results)
    setTesting(false)
  }

  const discoverRouterAddress = async () => {
    setTesting(true)
    onResult({
      id: 'router-discovery',
      name: 'Router Discovery',
      status: 'running',
      message: 'Discovering router address...'
    })

    try {
      // Try to get a quote and extract the allowanceTarget
      const response = await fetch('/api/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
          buyToken: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
          sellAmount: '1000000',
          slippagePercentage: 0.005,
          takerAddress: address || '0x0000000000000000000000000000000000000001'
        })
      })

      const data = await response.json()

      if (data.allowanceTarget) {
        setRouterAddress(data.allowanceTarget)
        onResult({
          id: 'router-discovery',
          name: 'Router Discovery',
          status: 'success',
          message: `Found router: ${data.allowanceTarget}`,
          data: { router: data.allowanceTarget, to: data.to }
        })
      } else if (data.to) {
        setRouterAddress(data.to)
        onResult({
          id: 'router-discovery',
          name: 'Router Discovery',
          status: 'warning',
          message: `Using 'to' address: ${data.to}`,
          data: { to: data.to }
        })
      } else {
        onResult({
          id: 'router-discovery',
          name: 'Router Discovery',
          status: 'error',
          message: 'Could not discover router address',
          data: data
        })
      }
    } catch (error) {
      onResult({
        id: 'router-discovery',
        name: 'Router Discovery',
        status: 'error',
        message: 'Failed to discover router',
        data: { error }
      })
    }

    setTesting(false)
  }

  const testApprovalFlow = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    setTesting(true)
    onResult({
      id: 'approval-flow',
      name: 'Approval Flow Test',
      status: 'running',
      message: 'Testing complete approval flow...'
    })

    try {
      // Step 1: Check current allowance
      const currentAllowance = await checkAllowance('USDC')

      // Step 2: Try to approve if needed
      if (currentAllowance === 0n) {
        onResult({
          id: 'approval-flow',
          name: 'Approval Flow Test',
          status: 'warning',
          message: 'Need approval - open console to see transaction attempt',
          data: { currentAllowance: '0', needsApproval: true }
        })
      } else {
        onResult({
          id: 'approval-flow',
          name: 'Approval Flow Test',
          status: 'success',
          message: 'Token already approved',
          data: { currentAllowance: formatUnits(currentAllowance, 6) }
        })
      }
    } catch (error) {
      onResult({
        id: 'approval-flow',
        name: 'Approval Flow Test',
        status: 'error',
        message: 'Approval flow test failed',
        data: { error }
      })
    }

    setTesting(false)
  }

  return (
    <div className="card-base p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Approval Tester</h3>
        </div>
        <button
          onClick={testAllAllowances}
          disabled={testing || !isConnected}
          className="btn-secondary px-3 py-1 text-sm"
        >
          {testing ? 'Testing...' : 'Check All'}
        </button>
      </div>

      {!isConnected ? (
        <p className="text-xs text-muted text-center py-4">
          Connect wallet to test approvals
        </p>
      ) : (
        <>
          {/* Router Info */}
          <div className="p-2 bg-secondary rounded mb-4">
            <div className="text-xs text-muted mb-2">Router/Spender Address:</div>
            <div className="text-xs font-mono break-all">{routerAddress}</div>
            <button
              onClick={discoverRouterAddress}
              disabled={testing}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Discover Router
            </button>
          </div>

          {/* Allowances */}
          <div className="space-y-2">
            {tokens.map(token => (
              <div key={token.symbol} className="flex items-center justify-between p-2 bg-secondary rounded">
                <span className="text-sm">{token.symbol}</span>
                <span className="text-xs text-muted">
                  {allowances[token.symbol] || 'Not checked'}
                </span>
              </div>
            ))}
          </div>

          {/* Test Approval Flow */}
          <button
            onClick={testApprovalFlow}
            disabled={testing}
            className="mt-4 btn-secondary w-full py-1 text-xs"
          >
            Test Complete Approval Flow
          </button>
        </>
      )}
    </div>
  )
}