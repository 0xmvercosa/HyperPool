'use client'

import { useState } from 'react'
import { TestResult } from '@/app/test-hyperbloom/page'
import { CheckCircle, XCircle, AlertCircle, Loader2, Wifi } from 'lucide-react'

interface ConnectionTestProps {
  onResult: (result: TestResult) => void
}

export function ConnectionTest({ onResult }: ConnectionTestProps) {
  const [testing, setTesting] = useState(false)
  const [localResults, setLocalResults] = useState<Record<string, TestResult>>({})

  const runTests = async () => {
    setTesting(true)
    setLocalResults({})

    // Test 1: API Connectivity
    await testAPIConnectivity()

    // Test 2: API Key Validation
    await testAPIKey()

    // Test 3: Network Status
    await testNetworkStatus()

    // Test 4: CORS Headers
    await testCORSHeaders()

    setTesting(false)
  }

  const testAPIConnectivity = async () => {
    const testId = 'api-connectivity'
    onResult({
      id: testId,
      name: 'API Connectivity',
      status: 'running',
      message: 'Testing connection to HyperBloom API...'
    })

    try {
      const response = await fetch('/api/swap/sources')

      if (response.ok) {
        const data = await response.json()
        const result: TestResult = {
          id: testId,
          name: 'API Connectivity',
          status: 'success',
          message: 'Successfully connected to HyperBloom API',
          data: data
        }
        onResult(result)
        setLocalResults(prev => ({ ...prev, [testId]: result }))
      } else {
        const result: TestResult = {
          id: testId,
          name: 'API Connectivity',
          status: 'error',
          message: `API returned status ${response.status}`,
          data: { status: response.status, statusText: response.statusText }
        }
        onResult(result)
        setLocalResults(prev => ({ ...prev, [testId]: result }))
      }
    } catch (error) {
      const result: TestResult = {
        id: testId,
        name: 'API Connectivity',
        status: 'error',
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { error }
      }
      onResult(result)
      setLocalResults(prev => ({ ...prev, [testId]: result }))
    }
  }

  const testAPIKey = async () => {
    const testId = 'api-key'
    onResult({
      id: testId,
      name: 'API Key Validation',
      status: 'running',
      message: 'Checking API key configuration...'
    })

    try {
      // Test with a simple price quote
      const response = await fetch('/api/swap/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
          buyToken: '0x5555555555555555555555555555555555555555',
          sellAmount: '1000000',
          slippagePercentage: 0.005
        })
      })

      const hasApiKey = process.env.NEXT_PUBLIC_HYPERBLOOM_API_KEY ||
                       process.env.HYPERBLOOM_API_KEY

      if (response.status === 401 || response.status === 403) {
        const result: TestResult = {
          id: testId,
          name: 'API Key Validation',
          status: 'error',
          message: 'Invalid or missing API key',
          data: { hasApiKey: !!hasApiKey }
        }
        onResult(result)
        setLocalResults(prev => ({ ...prev, [testId]: result }))
      } else {
        const result: TestResult = {
          id: testId,
          name: 'API Key Validation',
          status: hasApiKey ? 'success' : 'warning',
          message: hasApiKey ? 'API key is configured' : 'API key might be missing (check server logs)',
          data: { hasApiKey: !!hasApiKey }
        }
        onResult(result)
        setLocalResults(prev => ({ ...prev, [testId]: result }))
      }
    } catch (error) {
      const result: TestResult = {
        id: testId,
        name: 'API Key Validation',
        status: 'error',
        message: 'Failed to validate API key',
        data: { error }
      }
      onResult(result)
      setLocalResults(prev => ({ ...prev, [testId]: result }))
    }
  }

  const testNetworkStatus = async () => {
    const testId = 'network-status'
    onResult({
      id: testId,
      name: 'Network Status',
      status: 'running',
      message: 'Checking network configuration...'
    })

    try {
      // Check if we're connected to the right network
      const chainId = 999 // HyperEVM
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.hyperliquid.xyz/evm'

      // Try to fetch chain ID from RPC
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1
        })
      })

      if (response.ok) {
        const data = await response.json()
        const networkChainId = parseInt(data.result, 16)

        const result: TestResult = {
          id: testId,
          name: 'Network Status',
          status: networkChainId === chainId ? 'success' : 'warning',
          message: `Connected to chain ${networkChainId} (expected ${chainId})`,
          data: { chainId: networkChainId, expectedChainId: chainId, rpcUrl }
        }
        onResult(result)
        setLocalResults(prev => ({ ...prev, [testId]: result }))
      } else {
        throw new Error('RPC request failed')
      }
    } catch (error) {
      const result: TestResult = {
        id: testId,
        name: 'Network Status',
        status: 'error',
        message: 'Failed to check network status',
        data: { error }
      }
      onResult(result)
      setLocalResults(prev => ({ ...prev, [testId]: result }))
    }
  }

  const testCORSHeaders = async () => {
    const testId = 'cors-headers'
    onResult({
      id: testId,
      name: 'CORS Configuration',
      status: 'running',
      message: 'Checking CORS headers...'
    })

    try {
      const response = await fetch('/api/swap/price', {
        method: 'OPTIONS'
      })

      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
      }

      const result: TestResult = {
        id: testId,
        name: 'CORS Configuration',
        status: response.ok ? 'success' : 'warning',
        message: response.ok ? 'CORS properly configured' : 'CORS might have issues',
        data: corsHeaders
      }
      onResult(result)
      setLocalResults(prev => ({ ...prev, [testId]: result }))
    } catch (error) {
      const result: TestResult = {
        id: testId,
        name: 'CORS Configuration',
        status: 'error',
        message: 'Failed to check CORS',
        data: { error }
      }
      onResult(result)
      setLocalResults(prev => ({ ...prev, [testId]: result }))
    }
  }

  const getStatusIcon = (status?: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />
      default:
        return null
    }
  }

  return (
    <div className="card-base p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Connection Tests</h3>
        </div>
        <button
          onClick={runTests}
          disabled={testing}
          className="btn-secondary px-3 py-1 text-sm"
        >
          {testing ? 'Testing...' : 'Run Tests'}
        </button>
      </div>

      <div className="space-y-2">
        {['api-connectivity', 'api-key', 'network-status', 'cors-headers'].map(testId => {
          const result = localResults[testId]
          return (
            <div key={testId} className="flex items-center justify-between p-2 bg-secondary rounded">
              <span className="text-sm">
                {result?.name || testId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <div className="flex items-center gap-2">
                {result?.message && (
                  <span className="text-xs text-muted">{result.message}</span>
                )}
                {getStatusIcon(result?.status)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}