'use client'

import { useState, useEffect } from 'react'
import { useWallet } from './useWallet'

interface Investment {
  poolId: string
  amount: number
  timestamp: number
  txHash: string
}

interface InvestmentData {
  totalInvested: number
  totalEarnings: number
  availableFees: number
  investments: Investment[]
}

export function useInvestments() {
  const { address, isConnected } = useWallet()
  const [data, setData] = useState<InvestmentData>({
    totalInvested: 0,
    totalEarnings: 0,
    availableFees: 0,
    investments: []
  })

  // Load investments from localStorage
  useEffect(() => {
    if (!isConnected || !address) {
      setData({
        totalInvested: 0,
        totalEarnings: 0,
        availableFees: 0,
        investments: []
      })
      return
    }

    const loadInvestments = () => {
      const key = `investments_${address}`
      const stored = localStorage.getItem(key)

      if (stored) {
        try {
          const investments = JSON.parse(stored) as Investment[]
          const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0)

          // Mock earnings calculation (would be from blockchain in production)
          const totalEarnings = totalInvested * 0.05 // 5% mock earnings
          const availableFees = totalEarnings * 0.1 // 10% of earnings as fees

          setData({
            totalInvested,
            totalEarnings,
            availableFees,
            investments
          })
        } catch (error) {
          console.error('Failed to load investments:', error)
        }
      }
    }

    loadInvestments()

    // Listen for storage events to sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `investments_${address}`) {
        loadInvestments()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [address, isConnected])

  // Add new investment
  const addInvestment = (poolId: string, amount: number, txHash: string) => {
    if (!address) return

    const investment: Investment = {
      poolId,
      amount,
      timestamp: Date.now(),
      txHash
    }

    const key = `investments_${address}`
    const stored = localStorage.getItem(key)
    const investments = stored ? JSON.parse(stored) : []

    investments.push(investment)
    localStorage.setItem(key, JSON.stringify(investments))

    // Trigger reload
    const event = new StorageEvent('storage', {
      key: `investments_${address}`,
      newValue: JSON.stringify(investments),
      url: window.location.href
    })
    window.dispatchEvent(event)
  }

  // Collect fees
  const collectFees = async () => {
    if (!address || data.availableFees <= 0) return

    // In production, this would trigger a blockchain transaction
    // For now, we'll just update the local state
    const key = `fees_collected_${address}`
    const previouslyCollected = parseFloat(localStorage.getItem(key) || '0')
    const newTotal = previouslyCollected + data.availableFees

    localStorage.setItem(key, newTotal.toString())

    // Reset available fees
    setData(prev => ({
      ...prev,
      availableFees: 0,
      totalEarnings: prev.totalEarnings + prev.availableFees
    }))

    return true
  }

  return {
    ...data,
    addInvestment,
    collectFees
  }
}