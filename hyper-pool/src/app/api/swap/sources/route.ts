import { NextRequest, NextResponse } from 'next/server'

const HYPERBLOOM_API_URL = process.env.HYPERBLOOM_API_URL || 'https://api.hyperbloom.xyz'
const HYPERBLOOM_API_KEY = process.env.HYPERBLOOM_API_KEY || process.env.NEXT_PUBLIC_HYPERBLOOM_API_KEY || ''

export async function GET(request: NextRequest) {
  try {
    console.log('[API Route] Fetching supported sources and tokens')

    const url = `${HYPERBLOOM_API_URL}/swap/v1/sources`

    // Call HyperBloom API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api-key': HYPERBLOOM_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API Route] HyperBloom Sources API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })

      return NextResponse.json(
        {
          error: `HyperBloom API error: ${response.statusText}`,
          details: errorText,
          status: response.status
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[API Route] Sources response:', data)

    return NextResponse.json(data)
  } catch (error) {
    console.error('[API Route] Sources endpoint error:', error)

    // Return mock data for development if API fails
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        sources: ['HyperLiquid'],
        tokens: [
          {
            symbol: 'USDC',
            address: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
            decimals: 6
          },
          {
            symbol: 'USDT',
            address: '0x200000000000000000000000000000000000010c',
            decimals: 6
          },
          {
            symbol: 'HYPE',
            address: '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
            decimals: 18,
            isNative: true
          }
        ]
      })
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}