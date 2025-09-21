'use client'

import { useState } from 'react'
import { TestResult } from '@/app/test-hyperbloom/page'
import { Download, Copy, CheckCircle } from 'lucide-react'

interface ConfigExporterProps {
  results: TestResult[]
}

export function ConfigExporter({ results }: ConfigExporterProps) {
  const [copied, setCopied] = useState(false)

  const generateConfig = () => {
    // Extract working configurations from results
    const workingTokens: string[] = []
    const workingPairs: any[] = []
    let routerAddress = ''
    let apiStatus = false

    results.forEach(result => {
      if (result.id === 'api-connectivity' && result.status === 'success') {
        apiStatus = true
      }

      if (result.id === 'router-discovery' && result.data?.router) {
        routerAddress = result.data.router
      }

      if (result.id.startsWith('quote-') && result.status === 'success') {
        workingPairs.push(result.data)
      }

      if (result.id === 'token-validation' && result.data) {
        result.data.forEach((token: any) => {
          if (token.status === 'success') {
            workingTokens.push(token.token)
          }
        })
      }
    })

    const config = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      api: {
        url: process.env.NEXT_PUBLIC_HYPERBLOOM_API_URL || 'https://api.hyperbloom.xyz',
        status: apiStatus,
        hasApiKey: !!process.env.NEXT_PUBLIC_HYPERBLOOM_API_KEY
      },
      network: {
        chainId: 999,
        name: 'HyperEVM',
        rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.hyperliquid.xyz/evm'
      },
      contracts: {
        router: routerAddress || 'Unknown - run discovery',
        tokens: {
          USDC: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
          USDT: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
          WHYPE: '0x5555555555555555555555555555555555555555'
        }
      },
      working: {
        tokens: workingTokens,
        pairsCount: workingPairs.length
      },
      testSummary: {
        total: results.length,
        passed: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        warnings: results.filter(r => r.status === 'warning').length
      }
    }

    return config
  }

  const exportConfig = () => {
    const config = generateConfig()
    const data = JSON.stringify(config, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hyperbloom-config-${Date.now()}.json`
    a.click()
  }

  const copyConfig = () => {
    const config = generateConfig()
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateEnvFile = () => {
    const config = generateConfig()
    const envContent = `# HyperBloom Configuration
# Generated: ${new Date().toISOString()}

# API Configuration
NEXT_PUBLIC_HYPERBLOOM_API_URL=${config.api.url}
NEXT_PUBLIC_HYPERBLOOM_API_KEY=your_api_key_here
HYPERBLOOM_API_KEY=your_api_key_here

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=${config.network.chainId}
NEXT_PUBLIC_RPC_URL=${config.network.rpcUrl}

# Contract Addresses
NEXT_PUBLIC_ROUTER_ADDRESS=${config.contracts.router}
NEXT_PUBLIC_USDC_ADDRESS=${config.contracts.tokens.USDC}
NEXT_PUBLIC_USDT_ADDRESS=${config.contracts.tokens.USDT}
NEXT_PUBLIC_WHYPE_ADDRESS=${config.contracts.tokens.WHYPE}
`

    const blob = new Blob([envContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '.env.local'
    a.click()
  }

  const hasResults = results.length > 0

  return (
    <div className="card-base p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Config Exporter</h3>
        </div>
      </div>

      {hasResults ? (
        <>
          {/* Quick Summary */}
          <div className="p-3 bg-secondary rounded mb-4">
            <div className="text-xs space-y-1">
              <div>✅ API Connected: {results.find(r => r.id === 'api-connectivity')?.status === 'success' ? 'Yes' : 'No'}</div>
              <div>🔑 Router Found: {results.find(r => r.id === 'router-discovery')?.data?.router ? 'Yes' : 'No'}</div>
              <div>🪙 Working Tokens: {results.filter(r => r.id.startsWith('quote-') && r.status === 'success').length}</div>
              <div>📊 Tests Passed: {results.filter(r => r.status === 'success').length}/{results.length}</div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="space-y-2">
            <button
              onClick={exportConfig}
              className="btn-secondary w-full py-2 text-sm"
            >
              Export Configuration JSON
            </button>

            <button
              onClick={copyConfig}
              className="btn-secondary w-full py-2 text-sm flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Configuration
                </>
              )}
            </button>

            <button
              onClick={generateEnvFile}
              className="btn-secondary w-full py-2 text-sm"
            >
              Generate .env.local File
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded">
            <p className="text-xs text-amber-500">
              💡 Use the exported configuration to update your app settings with working values
            </p>
          </div>
        </>
      ) : (
        <p className="text-xs text-muted text-center py-4">
          Run tests first to generate configuration
        </p>
      )}
    </div>
  )
}