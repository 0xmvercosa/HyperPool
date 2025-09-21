# API Documentation - Hyper Pool

## 🔌 External APIs

### Hyperbloom API

**Base URL**: `https://api.hyperbloom.io`

**Authentication**:
```http
X-API-Key: {NEXT_PUBLIC_HYPERBLOOM_API_KEY}
```

#### Endpoints

##### 1. Get Swap Quote
```http
POST /v1/swap/quote
Content-Type: application/json
X-API-Key: {api_key}

{
  "poolId": "usdc-hype-usdt",
  "inputToken": "USDC",
  "inputAmount": "100",
  "ratios": [50, 50]
}
```

**Response**:
```json
{
  "inputToken": "USDC",
  "outputTokens": ["HYPE", "USDT"],
  "inputAmount": "100",
  "outputAmounts": ["20", "50"],
  "ratios": [50, 50],
  "priceImpact": 0.02,
  "fee": 0.003,
  "estimatedGas": "0.001"
}
```

##### 2. Execute Swap
```http
POST /v1/swap/execute
Content-Type: application/json
X-API-Key: {api_key}

{
  "poolId": "usdc-hype-usdt",
  "inputToken": "USDC",
  "inputAmount": "100",
  "walletAddress": "0x...",
  "slippage": 0.5
}
```

**Response**:
```json
{
  "success": true,
  "transactionHash": "0x...",
  "outputAmounts": {
    "HYPE": "19.95",
    "USDT": "49.90"
  }
}
```

##### 3. Get Pool Information
```http
GET /v1/pool/{poolId}
X-API-Key: {api_key}
```

**Response**:
```json
{
  "id": "usdc-hype-usdt",
  "name": "USDC/HYPE/USDT Pool",
  "tokens": ["USDC", "HYPE", "USDT"],
  "totalLiquidity": "1000000",
  "volume24h": "50000",
  "apy": 12.5,
  "currentRatios": [40, 35, 25],
  "fees": {
    "swap": 0.003,
    "deposit": 0,
    "withdraw": 0.001
  }
}
```

##### 4. Get Token Price
```http
GET /v1/token/{symbol}/price
X-API-Key: {api_key}
```

**Response**:
```json
{
  "symbol": "HYPE",
  "price": 2.50,
  "change24h": 5.2,
  "volume24h": "1000000"
}
```

### Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient balance for swap",
    "details": {}
  }
}
```

**Common Error Codes**:
- `INVALID_API_KEY` - API key is invalid or missing
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INSUFFICIENT_BALANCE` - User doesn't have enough tokens
- `SLIPPAGE_EXCEEDED` - Price changed beyond slippage tolerance
- `POOL_NOT_FOUND` - Invalid pool ID
- `INVALID_AMOUNT` - Amount is invalid or too small
- `NETWORK_ERROR` - Blockchain network issues

## 🔗 Blockchain Interactions

### HyperEVM RPC

**Endpoint**: `https://rpc.hyperliquid.xyz/evm`

#### Key Methods

##### Get Balance
```javascript
const balance = await publicClient.getBalance({
  address: userAddress,
  blockTag: 'latest'
})
```

##### Get Token Balance
```javascript
const tokenBalance = await publicClient.readContract({
  address: tokenAddress,
  abi: erc20ABI,
  functionName: 'balanceOf',
  args: [userAddress]
})
```

##### Approve Token Spending
```javascript
const hash = await walletClient.writeContract({
  address: tokenAddress,
  abi: erc20ABI,
  functionName: 'approve',
  args: [spenderAddress, amount]
})
```

## 🔑 Internal Service APIs

### HyperbloomService (`/lib/services/hyperbloom.ts`)

```typescript
class HyperbloomService {
  // Get swap quote with ratios
  async getSwapQuote(
    poolId: string,
    inputToken: string,
    inputAmount: string,
    ratios: number[] = [50, 50]
  ): Promise<SwapQuote>

  // Execute the swap transaction
  async executeSwap(
    request: SwapRequest
  ): Promise<SwapResponse>

  // Get pool information
  async getPoolInfo(
    poolId: string
  ): Promise<PoolInfo>

  // Get current token price
  async getTokenPrice(
    token: string
  ): Promise<number>

  // Validate swap parameters
  validateSwap(
    inputAmount: string,
    minOutputAmount?: string
  ): ValidationResult

  // Calculate slippage percentage
  calculateSlippage(
    expectedAmount: string,
    actualAmount: string
  ): number
}
```

## 🪝 Custom Hooks API

### useWallet
```typescript
const {
  isConnected: boolean,
  isReady: boolean,
  address: string | null,
  balance: string | null,
  connectWallet: () => Promise<void>,
  disconnectWallet: () => Promise<void>,
  switchWallet: () => Promise<void>,
  wallets: Wallet[]
} = useWallet()
```

### useSwap
```typescript
const {
  isLoading: boolean,
  isSwapping: boolean,
  quote: SwapQuote | null,
  error: string | null,
  getQuote: (poolId, inputToken, amount, ratios) => Promise<SwapQuote>,
  executeSwap: (poolId, inputToken, amount, slippage) => Promise<SwapResponse>,
  clearQuote: () => void,
  isConnected: boolean,
  address: string | null
} = useSwap()
```

### useHyperEVM
```typescript
const {
  isOnHyperEVM: boolean,
  switchToHyperEVM: () => Promise<void>,
  ensureHyperEVM: () => Promise<boolean>,
  currentChainId: number | undefined
} = useHyperEVM()
```

## 📊 Data Types

### Core Types
```typescript
interface SwapQuote {
  inputToken: string
  outputTokens: string[]
  inputAmount: string
  outputAmounts: string[]
  ratios: number[]
  priceImpact: number
  fee: number
  estimatedGas: string
}

interface SwapRequest {
  poolId: string
  inputToken: string
  inputAmount: string
  walletAddress: string
  slippage?: number
}

interface SwapResponse {
  success: boolean
  txHash?: string
  error?: string
  outputAmounts?: Record<string, string>
}

interface Pool {
  id: string
  name: string
  tokens: Token[]
  tvl: string
  apy: number
  volume24h: string
}

interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  icon?: string
}
```

## 🔄 State Management API

### Zustand Store
```typescript
interface StoreState {
  // User state
  user: {
    address: string | null
    balance: string
    isConnected: boolean
  }

  // Pool state
  pools: Pool[]
  selectedPool: Pool | null

  // Actions
  setUser: (user: Partial<User>) => void
  setPools: (pools: Pool[]) => void
  selectPool: (poolId: string) => void
  reset: () => void
}

// Usage
const { user, pools, setUser } = useStore()
```

## 📡 WebSocket Events (Future)

### Pool Updates
```javascript
ws.on('pool:update', (data) => {
  // Real-time pool data updates
  console.log('Pool updated:', data)
})
```

### Price Updates
```javascript
ws.on('price:update', (data) => {
  // Real-time price updates
  console.log('Price updated:', data)
})
```

## 🔒 Rate Limiting

- **Hyperbloom API**: 100 requests per minute
- **RPC Calls**: 50 requests per second
- **WebSocket**: 10 messages per second

## 🚨 Error Handling Best Practices

1. **Always wrap API calls in try-catch**
2. **Provide user-friendly error messages**
3. **Log errors for debugging**
4. **Implement retry logic for network failures**
5. **Show loading states during async operations**

```typescript
try {
  const result = await apiCall()
  // Handle success
} catch (error) {
  console.error('API Error:', error)
  toast.error('Something went wrong. Please try again.')
  // Optional: Report to error tracking service
}
```

## 📝 Testing API Calls

### Mock Mode (Development)
Set `NODE_ENV=development` to enable mock responses when API fails.

### Test Endpoints
```bash
# Test swap quote
curl -X POST https://api.hyperbloom.io/v1/swap/quote \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"poolId":"usdc-hype-usdt","inputToken":"USDC","inputAmount":"100","ratios":[50,50]}'
```

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready