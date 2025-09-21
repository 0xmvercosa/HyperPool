// Test function to verify token addresses with HyperBloom API
export async function testTokenSupport() {
  try {
    console.log('Testing token support on HyperBloom API...')

    // Test 1: Get supported sources
    const sourcesResponse = await fetch('/api/swap/sources')
    if (sourcesResponse.ok) {
      const sources = await sourcesResponse.json()
      console.log('Supported sources:', sources)
    } else {
      console.error('Failed to fetch sources')
    }

    // Test 2: Test USDC -> HYPE swap
    console.log('Testing USDC -> HYPE price...')
    const hypeTest = await fetch('/api/swap/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f', // USDC
        buyToken: '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', // HYPE (native)
        sellAmount: '1000000', // 1 USDC
        slippagePercentage: 0.005
      })
    })

    if (hypeTest.ok) {
      const hypeData = await hypeTest.json()
      console.log('USDC -> HYPE success:', hypeData)
    } else {
      const error = await hypeTest.json()
      console.error('USDC -> HYPE failed:', error)
    }

    // Test 3: Test USDC -> USDT swap
    console.log('Testing USDC -> USDT price...')
    const usdtTest = await fetch('/api/swap/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellToken: '0xb88339CB7199b77E23DB6E890353E22632Ba630f', // USDC
        buyToken: '0x200000000000000000000000000000000000010c', // USDT
        sellAmount: '1000000', // 1 USDC
        slippagePercentage: 0.005
      })
    })

    if (usdtTest.ok) {
      const usdtData = await usdtTest.json()
      console.log('USDC -> USDT success:', usdtData)
    } else {
      const error = await usdtTest.json()
      console.error('USDC -> USDT failed:', error)
    }

    console.log('Token test completed. Check console for results.')
  } catch (error) {
    console.error('Test error:', error)
  }
}

// Add to window for easy testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testTokenSupport = testTokenSupport
}