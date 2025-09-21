import { NextRequest, NextResponse } from 'next/server'

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

    // takerAddress is required for quote
    if (!takerAddress) {
      return NextResponse.json(
        { error: 'takerAddress is required for swap quote' },
        { status: 400 }
      )
    }

    console.log('[API Route] Quote request:', {
      sellToken,
      buyToken,
      sellAmount,
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
      takerAddress
    })

    const url = `${HYPERBLOOM_API_URL}/swap/v1/quote?${params}`

    console.log('[API Route] Calling HyperBloom Quote API:', url)

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

      console.error('[API Route] HyperBloom Quote API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorDetails,
        fullError: errorDetails,
        errorMessage: errorDetails?.values?.message || errorDetails?.message || errorDetails?.reason,
        errorCode: errorDetails?.code,
        requestParams: {
          sellToken,
          buyToken,
          sellAmount,
          takerAddress
        }
      })

      // Log specific allowance error details
      if (errorDetails?.values?.message?.includes('allowance') ||
          errorDetails?.values?.message?.includes('ERC20: transfer amount exceeds allowance') ||
          errorDetails?.reason?.includes('allowance') ||
          errorDetails?.message?.includes('allowance')) {

        console.error('[ALLOWANCE ERROR] Detailed info:', {
          errorMessage: errorDetails?.values?.message || errorDetails?.message,
          expectedSpender: errorDetails?.values?.spender || 'not provided',
          requiredAllowance: errorDetails?.values?.requiredAllowance || 'not provided',
          currentAllowance: errorDetails?.values?.currentAllowance || 'not provided',
          token: sellToken,
          amount: sellAmount,
          takerAddress
        })

        return NextResponse.json(
          {
            error: 'Insufficient token allowance. Please approve token spending first.',
            details: errorDetails,
            needsApproval: true,
            allowanceInfo: {
              message: errorDetails?.values?.message || errorDetails?.message,
              spender: errorDetails?.values?.spender,
              required: errorDetails?.values?.requiredAllowance,
              current: errorDetails?.values?.currentAllowance
            }
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: `HyperBloom API error: ${response.statusText}`,
          details: errorDetails,
          status: response.status
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[API Route] Quote response success:', {
      to: data.to,
      value: data.value,
      gas: data.gas,
      buyAmount: data.buyAmount,
      allowanceTarget: data.allowanceTarget
    })

    // Return the allowance target so the frontend knows which address to approve
    return NextResponse.json({
      ...data,
      allowanceTarget: data.allowanceTarget || data.to
    })
  } catch (error) {
    console.error('[API Route] Quote endpoint error:', error)

    // Return mock transaction data for development if API fails
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Route] Returning mock transaction data for development')

      // Mock transaction data that can be executed
      return NextResponse.json({
        chainId: 999,
        to: "0x0000000000000000000000000000000000000000", // Mock swap contract
        data: "0x" + "00".repeat(100), // Mock calldata
        value: "0",
        gas: "300000",
        gasPrice: "47500000",
        guaranteedPrice: "2.45",
        price: "2.5",
        estimatedPriceImpact: "0.02",
        protocolFee: "0",
        minimumProtocolFee: "0",
        buyTokenAddress: "0x0000000000000000000000000000000000000000",
        buyAmount: "400000000000000000",
        sellTokenAddress: "0xb88339CB7199b77E23DB6E890353E22632Ba630f",
        sellAmount: "1000000",
        allowanceTarget: "0x0000000000000000000000000000000000000000",
        sellTokenToEthRate: "1",
        buyTokenToEthRate: "2.5",
        expectedSlippage: null
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}