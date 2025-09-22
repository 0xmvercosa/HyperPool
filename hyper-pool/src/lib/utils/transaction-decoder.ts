import { decodeFunctionData } from 'viem'
import { MULTICALL3_ABI } from './multicall'

/**
 * Decode transaction data to provide better descriptions
 */
export function decodeTransactionData(data: `0x${string}`): string | null {
  try {
    // Try to decode as Multicall3
    const decoded = decodeFunctionData({
      abi: MULTICALL3_ABI,
      data
    })

    if (decoded.functionName === 'aggregate3' || decoded.functionName === 'aggregate3Value') {
      const calls = decoded.args[0] as any[]
      return `Batch Swap (${calls.length} tokens)`
    }
  } catch (error) {
    // Not a multicall transaction
  }

  // Check for common swap signatures
  const signature = data.slice(0, 10)

  // Common swap function signatures
  const swapSignatures: Record<string, string> = {
    '0x415565b0': 'Swap (transformERC20)',
    '0x38ed1739': 'Swap (swapExactTokensForTokens)',
    '0x7ff36ab5': 'Swap (swapExactETHForTokens)',
    '0x18cbafe5': 'Swap (swapExactTokensForETH)',
    '0xfb3bdb41': 'Swap (swapETHForExactTokens)',
    '0xf305d719': 'Add Liquidity',
    '0x02751cec': 'Remove Liquidity',
    '0xbaa2abde': 'Remove Liquidity With Permit',
  }

  return swapSignatures[signature] || null
}

/**
 * Generate a human-readable description for a swap transaction
 */
export function generateSwapDescription(
  inputAmount: string,
  inputToken: string,
  outputTokens: string[],
  ratios?: number[]
): string {
  if (outputTokens.length === 1) {
    return `Swap ${inputAmount} ${inputToken} to ${outputTokens[0]}`
  }

  const outputs = outputTokens.map((token, i) => {
    const ratio = ratios?.[i] || Math.floor(100 / outputTokens.length)
    return `${token} (${ratio}%)`
  }).join(' + ')

  return `Split Swap: ${inputAmount} ${inputToken} → ${outputs}`
}

/**
 * Format transaction for wallet display
 */
export function formatTransactionForWallet(tx: {
  to: string
  data: `0x${string}`
  value: bigint
  inputAmount?: string
  inputToken?: string
  outputTokens?: string[]
  ratios?: number[]
}): any {
  let description = decodeTransactionData(tx.data)

  // If we have swap details, create a better description
  if (!description && tx.inputAmount && tx.inputToken && tx.outputTokens) {
    description = generateSwapDescription(
      tx.inputAmount,
      tx.inputToken,
      tx.outputTokens,
      tx.ratios
    )
  }

  return {
    ...tx,
    // Add metadata that some wallets might recognize
    metadata: {
      description,
      protocol: 'HyperPool',
      action: tx.outputTokens && tx.outputTokens.length > 1 ? 'Multi-Swap' : 'Swap',
      inputAmount: tx.inputAmount,
      inputToken: tx.inputToken,
      outputTokens: tx.outputTokens,
      ratios: tx.ratios
    }
  }
}