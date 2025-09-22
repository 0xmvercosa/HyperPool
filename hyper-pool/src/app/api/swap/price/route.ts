import { NextRequest, NextResponse } from 'next/server'
import { validateTokenAddress, getTokenByAddress } from '@/lib/utils/tokenValidation'

const HYPERBLOOM_API_URL = process.env.HYPERBLOOM_API_URL || 'https://api.hyperbloom.xyz'
const HYPERBLOOM_API_KEY = process.env.HYPERBLOOM_API_KEY || process.env.NEXT_PUBLIC_HYPERBLOOM_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sellToken,
      buyToken,
      sellAmount,
      slippagePercentage = 0.005,
      takerAddress
    } = body

    // Validate token addresses
    const sellTokenValidation = validateTokenAddress(sellToken)
    const buyTokenValidation = validateTokenAddress(buyToken)

    if (!sellTokenValidation.valid) {
      console.error('[API Route] Invalid sell token:', sellToken, sellTokenValidation.error)
      return NextResponse.json(
        { error: `Invalid sell token: ${sellTokenValidation.error}` },
        { status: 400 }
      )
    }

    if (!buyTokenValidation.valid) {
      console.error('[API Route] Invalid buy token:', buyToken, buyTokenValidation.error)
      return NextResponse.json(
        { error: `Invalid buy token: ${buyTokenValidation.error}` },
        { status: 400 }
      )
    }

    const sellTokenInfo = getTokenByAddress(sellToken)
    const buyTokenInfo = getTokenByAddress(buyToken)

    console.log('[API Route] Price request:', {
      sellToken: `${sellTokenInfo?.symbol} (${sellToken})`,
      buyToken: `${buyTokenInfo?.symbol} (${buyToken})`,
      sellAmount,
      sellAmountHuman: sellTokenInfo ? Number(sellAmount) / Math.pow(10, sellTokenInfo.decimals) : sellAmount,
      slippagePercentage,
      takerAddress,
      apiUrl: HYPERBLOOM_API_URL,
      hasApiKey: !!HYPERBLOOM_API_KEY
    })

    // Build query parameters
    const params = new URLSearchParams({
      sellToken,
      buyToken,
      sellAmount,
      slippagePercentage: slippagePercentage.toString(),
    })

    if (takerAddress) {
      params.append('takerAddress', takerAddress)
    }

    const url = `${HYPERBLOOM_API_URL}/swap/v1/price?${params}`

    console.log('[API Route] Calling HyperBloom API:', url)

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
      let errorDetails: any
      try {
        errorDetails = JSON.parse(errorText)
      } catch {
        errorDetails = errorText
      }

      console.error('[API Route] HyperBloom API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorDetails,
        request: {
          url,
          sellToken,
          buyToken,
          sellAmount
        }
      })

      // Log específico para USDC
      if (sellToken === '0xb88339CB7199b77E23DB6E890353E22632Ba630f' ||
          buyToken === '0xb88339CB7199b77E23DB6E890353E22632Ba630f') {
        console.error('[USDC DEBUG] Full error details:', {
          errorCode: errorDetails?.code,
          errorReason: errorDetails?.reason,
          validationErrors: errorDetails?.validationErrors,
          fullUrl: url,
          headers: {
            'api-key': HYPERBLOOM_API_KEY ? 'SET (hidden)' : 'NOT SET',
          }
        })
      }

      // Handle specific error cases
      if (errorDetails?.validationErrors) {
        const tokenErrors = errorDetails.validationErrors.filter((e: any) =>
          e.field === 'buyToken' || e.field === 'sellToken'
        )
        if (tokenErrors.length > 0) {
          console.error('[API Route] Token validation errors:', tokenErrors)
        }
      }

      return NextResponse.json(
        {
          error: `HyperBloom API error: ${response.statusText}`,
          details: errorDetails,
          status: response.status,
          request: { sellToken, buyToken, sellAmount }
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[API Route] Price response success:', {
      allowanceTarget: data.allowanceTarget,
      to: data.to,
      buyAmount: data.buyAmount,
      buyAmountHuman: buyTokenInfo ? Number(data.buyAmount) / Math.pow(10, buyTokenInfo.decimals) : data.buyAmount,
      sellAmount: data.sellAmount,
      sellAmountHuman: sellTokenInfo ? Number(data.sellAmount) / Math.pow(10, sellTokenInfo.decimals) : data.sellAmount,
      price: data.price,
      estimatedPriceImpact: data.estimatedPriceImpact
    })

    // Log importante sobre allowanceTarget
    if (data.allowanceTarget) {
      const EXPECTED_ROUTER = '0x4212a77e4533eCa49643d7B731F5FB1b2782FE94'
      console.log('[IMPORTANT] Allowance Target from API:', data.allowanceTarget)
      console.log('[IMPORTANT] Expected HYPERBLOOM_ROUTER:', EXPECTED_ROUTER)
      if (data.allowanceTarget.toLowerCase() !== EXPECTED_ROUTER.toLowerCase()) {
        console.warn('[WARNING] Allowance Target MISMATCH! Router addresses do not match!')
        console.warn('[WARNING] API returned:', data.allowanceTarget)
        console.warn('[WARNING] Expected:', EXPECTED_ROUTER)
      } else {
        console.log('[SUCCESS] Allowance target matches expected router')
      }
    }

    // Ensure we return the full data structure
    return NextResponse.json({
      ...data,
      // Ensure these fields exist for frontend compatibility
      chainId: data.chainId || 999,
      value: data.value || '0',
      gas: data.gas || '300000',
      estimatedGas: data.estimatedGas || data.gas || '300000',
      protocolFee: data.protocolFee || '0',
      minimumProtocolFee: data.minimumProtocolFee || '0',
      expectedSlippage: data.expectedSlippage || null
    })
  } catch (error) {
    console.error('[API Route] Price endpoint error:', error)

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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}