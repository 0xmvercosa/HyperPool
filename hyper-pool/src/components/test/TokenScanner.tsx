'use client'

import { useState } from 'react'
import { Search, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface TokenTest {
  symbol: string
  address: string
  status?: 'testing' | 'success' | 'error'
  message?: string
  data?: any
}

const KNOWN_TOKENS: TokenTest[] = [
  // Tokens from config
  { symbol: 'USDC', address: '0xb88339CB7199b77E23DB6E890353E22632Ba630f' },
  { symbol: 'HYPE (Native)', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' },
  { symbol: 'WHYPE', address: '0x5555555555555555555555555555555555555555' },
  { symbol: 'USDT', address: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb' },
  { symbol: 'feUSD', address: '0x02c6a2fa58cc01a18b8d9e00ea48d65e4df26c70' },

  // Common USDC addresses on different chains (for testing)
  { symbol: 'USDC (Alt1)', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { symbol: 'USDC (Alt2)', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' },

  // Test different addresses
  { symbol: 'ETH (Native)', address: '0x0000000000000000000000000000000000000000' },
]

export function TokenScanner() {
  const [results, setResults] = useState<TokenTest[]>([])
  const [scanning, setScanning] = useState(false)
  const [currentToken, setCurrentToken] = useState<string>('')

  const testToken = async (token: TokenTest): Promise<TokenTest> => {
    setCurrentToken(token.symbol)

    try {
      // Test as sellToken (from token to HYPE)
      const sellResponse = await fetch('/api/swap/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellToken: token.address,
          buyToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // HYPE
          sellAmount: '1000000', // 1 token with 6 decimals
          slippagePercentage: 0.005
        })
      })

      const sellData = await sellResponse.json()

      // Test as buyToken (from HYPE to token)
      const buyResponse = await fetch('/api/swap/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // HYPE
          buyToken: token.address,
          sellAmount: '1000000000000000000', // 1 HYPE
          slippagePercentage: 0.005
        })
      })

      const buyData = await buyResponse.json()

      // Check if token works in either direction
      const sellWorks = sellResponse.ok && !sellData.error
      const buyWorks = buyResponse.ok && !buyData.error

      if (sellWorks || buyWorks) {
        return {
          ...token,
          status: 'success',
          message: `Works as: ${sellWorks ? 'sellToken' : ''} ${buyWorks ? 'buyToken' : ''}`,
          data: { sellData, buyData, sellWorks, buyWorks }
        }
      } else {
        // Get specific error message
        const errorMsg = sellData.details?.validationErrors?.[0]?.reason ||
                        buyData.details?.validationErrors?.[0]?.reason ||
                        sellData.error || buyData.error || 'Unknown error'

        return {
          ...token,
          status: 'error',
          message: errorMsg,
          data: { sellData, buyData }
        }
      }
    } catch (error) {
      return {
        ...token,
        status: 'error',
        message: 'Network error',
        data: { error }
      }
    }
  }

  const scanAllTokens = async () => {
    setScanning(true)
    setResults([])

    const newResults: TokenTest[] = []

    for (const token of KNOWN_TOKENS) {
      const result = await testToken(token)
      newResults.push(result)
      setResults([...newResults])
    }

    setCurrentToken('')
    setScanning(false)
  }

  const testCustomToken = async () => {
    const addressInput = document.getElementById('custom-token-address') as HTMLInputElement
    const symbolInput = document.getElementById('custom-token-symbol') as HTMLInputElement

    if (!addressInput?.value || !symbolInput?.value) {
      alert('Please enter both symbol and address')
      return
    }

    setScanning(true)
    const result = await testToken({
      symbol: symbolInput.value,
      address: addressInput.value
    })
    setResults(prev => [...prev, result])
    setScanning(false)
  }

  const workingTokens = results.filter(r => r.status === 'success')
  const failedTokens = results.filter(r => r.status === 'error')

  return (
    <div className="card-base p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Token Scanner</h2>
        </div>
        <button
          onClick={scanAllTokens}
          disabled={scanning}
          className="btn-primary px-4 py-2"
        >
          {scanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Scanning...
            </>
          ) : (
            'Scan All Tokens'
          )}
        </button>
      </div>

      {currentToken && (
        <div className="mb-4 p-3 bg-primary/10 rounded flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Testing: {currentToken}</span>
        </div>
      )}

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
            <div className="text-2xl font-bold text-green-500">{workingTokens.length}</div>
            <div className="text-xs text-green-500">Working Tokens</div>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
            <div className="text-2xl font-bold text-red-500">{failedTokens.length}</div>
            <div className="text-xs text-red-500">Failed Tokens</div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded flex items-center justify-between ${
                result.status === 'success'
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}
            >
              <div>
                <div className="font-medium">{result.symbol}</div>
                <div className="text-xs text-muted font-mono">
                  {result.address.slice(0, 10)}...{result.address.slice(-8)}
                </div>
                <div className="text-xs mt-1">{result.message}</div>
              </div>
              <div>
                {result.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Working Tokens Export */}
      {workingTokens.length > 0 && (
        <div className="mb-6 p-4 bg-secondary rounded">
          <h3 className="text-sm font-semibold mb-2">Working Tokens Configuration:</h3>
          <pre className="text-xs overflow-auto">
{JSON.stringify(
  workingTokens.reduce((acc, token) => ({
    ...acc,
    [token.symbol]: {
      address: token.address,
      works_as: token.data?.sellWorks && token.data?.buyWorks
        ? 'both'
        : token.data?.sellWorks
        ? 'sellToken'
        : 'buyToken'
    }
  }), {}),
  null,
  2
)}
          </pre>
          <button
            onClick={() => {
              const config = workingTokens.map(t => ({
                symbol: t.symbol,
                address: t.address
              }))
              navigator.clipboard.writeText(JSON.stringify(config, null, 2))
              alert('Copied to clipboard!')
            }}
            className="mt-2 btn-secondary text-xs px-3 py-1"
          >
            Copy Working Tokens
          </button>
        </div>
      )}

      {/* Custom Token Test */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold mb-3">Test Custom Token:</h3>
        <div className="space-y-2">
          <input
            id="custom-token-symbol"
            placeholder="Token Symbol (e.g., DAI)"
            className="w-full px-3 py-2 bg-secondary rounded text-sm"
          />
          <input
            id="custom-token-address"
            placeholder="Token Address (0x...)"
            className="w-full px-3 py-2 bg-secondary rounded text-sm"
          />
          <button
            onClick={testCustomToken}
            disabled={scanning}
            className="btn-secondary w-full py-2"
          >
            Test Custom Token
          </button>
        </div>
      </div>
    </div>
  )
}