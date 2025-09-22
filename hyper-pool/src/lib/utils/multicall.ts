import { encodeFunctionData, decodeFunctionResult, Address } from 'viem'
import { safeBigInt } from '@/lib/utils/safe-bigint'

// Multicall3 ABI - standard across most chains
export const MULTICALL3_ABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'target',
            type: 'address'
          },
          {
            internalType: 'bool',
            name: 'allowFailure',
            type: 'bool'
          },
          {
            internalType: 'bytes',
            name: 'callData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Call3[]',
        name: 'calls',
        type: 'tuple[]'
      }
    ],
    name: 'aggregate3',
    outputs: [
      {
        components: [
          {
            internalType: 'bool',
            name: 'success',
            type: 'bool'
          },
          {
            internalType: 'bytes',
            name: 'returnData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Result[]',
        name: 'returnData',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'target',
            type: 'address'
          },
          {
            internalType: 'bool',
            name: 'allowFailure',
            type: 'bool'
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256'
          },
          {
            internalType: 'bytes',
            name: 'callData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Call3Value[]',
        name: 'calls',
        type: 'tuple[]'
      }
    ],
    name: 'aggregate3Value',
    outputs: [
      {
        components: [
          {
            internalType: 'bool',
            name: 'success',
            type: 'bool'
          },
          {
            internalType: 'bytes',
            name: 'returnData',
            type: 'bytes'
          }
        ],
        internalType: 'struct Multicall3.Result[]',
        name: 'returnData',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'payable',
    type: 'function'
  }
] as const

export interface MulticallCall {
  target: Address
  allowFailure: boolean
  value?: bigint
  callData: `0x${string}`
}

export interface MulticallResult {
  success: boolean
  returnData: `0x${string}`
}

/**
 * Encode multiple calls into a single multicall transaction
 */
export function encodeMulticall(calls: MulticallCall[]): `0x${string}` {
  // Check if any call has value
  const hasValue = calls.some(call => call.value && call.value > 0n)

  if (hasValue) {
    // Use aggregate3Value for calls with ETH value
    return encodeFunctionData({
      abi: MULTICALL3_ABI,
      functionName: 'aggregate3Value',
      args: [calls.map(call => ({
        target: call.target,
        allowFailure: call.allowFailure,
        value: call.value || 0n,
        callData: call.callData
      }))]
    })
  } else {
    // Use regular aggregate3 for calls without ETH value
    return encodeFunctionData({
      abi: MULTICALL3_ABI,
      functionName: 'aggregate3',
      args: [calls.map(call => ({
        target: call.target,
        allowFailure: call.allowFailure,
        callData: call.callData
      }))]
    })
  }
}

/**
 * Calculate total value needed for multicall
 */
export function calculateMulticallValue(calls: MulticallCall[]): bigint {
  return calls.reduce((total, call) => total + (call.value || 0n), 0n)
}

/**
 * Combine swap quotes into a single multicall transaction
 */
export function combineSwapQuotes(swapQuotes: any[], metadata?: {
  description?: string
  protocol?: string
  action?: string
}): {
  to: Address
  data: `0x${string}`
  value: bigint
  gas: bigint
  metadata?: any
} {
  const multicallAddress = '0xcA11bde05977b3631167028862bE2a173976CA11' as Address

  // Convert swap quotes to multicall format
  const calls: MulticallCall[] = swapQuotes.map(quote => ({
    target: quote.to as Address,
    allowFailure: false, // Don't allow any swap to fail
    value: safeBigInt(quote.value, 0n),
    callData: quote.data as `0x${string}`
  }))

  // Encode the multicall
  const data = encodeMulticall(calls)

  // Calculate total value
  const value = calculateMulticallValue(calls)

  // Estimate gas (sum of all swaps + overhead)
  const totalGas = swapQuotes.reduce((sum, q) => sum + safeBigInt(q.gas, 300000n), 0n)
  const gasWithOverhead = totalGas + 100000n // Add overhead for multicall

  return {
    to: multicallAddress,
    data,
    value,
    gas: gasWithOverhead,
    metadata: metadata || {
      description: `Batch Swap (${swapQuotes.length} transactions)`,
      protocol: 'HyperPool',
      action: 'Multi-Swap'
    }
  }
}