export type Risk = 'low' | 'medium' | 'high'

export interface Pool {
  id: string
  name: string
  description: string
  apy: number
  risk: Risk
  tvl: number
  userInvested: string // Amount user has invested in this liquidity pool
  icon: string
  color: string
}

export interface UserData {
  address: string | null
  balance: string
  earnings: string
  pendingRewards: string
  isConnected: boolean
}

export interface Transaction {
  hash: string
  timestamp: number
  type: 'invest' | 'withdraw' | 'claim' | 'swap'
  amount: string
  pool: string
  status: 'pending' | 'success' | 'failed'
}