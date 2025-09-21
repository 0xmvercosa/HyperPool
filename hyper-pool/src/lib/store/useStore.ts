import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserData } from '@/types'
import { MOCK_DATA } from '@/lib/constants'

interface StoreState extends UserData {
  setWallet: (address: string | null) => void
  setBalance: (balance: string) => void
  setEarnings: (earnings: string) => void
  setPendingRewards: (rewards: string) => void
  connectWallet: () => void
  disconnectWallet: () => void
  claimRewards: () => Promise<void>
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      address: null,
      balance: '0',
      earnings: '0',
      pendingRewards: '0',
      isConnected: false,

      setWallet: (address) =>
        set({
          address,
          isConnected: !!address,
        }),

      setBalance: (balance) => set({ balance }),

      setEarnings: (earnings) => set({ earnings }),

      setPendingRewards: (pendingRewards) => set({ pendingRewards }),

      connectWallet: () => {
        // Mock wallet connection
        set({
          address: '0x1234...5678',
          isConnected: true,
          balance: MOCK_DATA.userBalance,
          earnings: MOCK_DATA.earningPool,
          pendingRewards: MOCK_DATA.pendingRewards,
        })
      },

      disconnectWallet: () => {
        set({
          address: null,
          isConnected: false,
          balance: '0',
          earnings: '0',
          pendingRewards: '0',
        })
      },

      claimRewards: async () => {
        // Mock claim rewards
        await new Promise((resolve) => setTimeout(resolve, 1000))
        set((state) => ({
          pendingRewards: '0',
          earnings: (
            parseFloat(state.earnings) + parseFloat(state.pendingRewards)
          ).toFixed(2),
        }))
      },
    }),
    {
      name: 'hyper-pool-storage',
    }
  )
)