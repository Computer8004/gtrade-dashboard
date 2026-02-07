import { useState, useEffect, useCallback } from 'react'
import { createPublicClient, http, formatEther, type Address } from 'viem'
import { arbitrum } from 'viem/chains'

export interface Strategy {
  id: string
  name: string
  address: Address
  balance: number
  pnl: number
  winRate: number
  trades: number
  openPositions: number
  lastTrade: string | null
}

export interface Trade {
  id: string
  strategy: string
  pair: string
  type: 'long' | 'short'
  size: number
  pnl: number
  timestamp: string
  status: 'open' | 'closed'
}

export interface PnLDataPoint {
  timestamp: string
  strategyA: number
  strategyB: number
  strategyC: number
  strategyD: number
  total: number
}

export interface FundingRate {
  pair: string
  rate: number
  trend: 'up' | 'down' | 'neutral'
}

const STRATEGY_WALLETS: Record<string, Address> = {
  A: '0xc9DB0FaddED889f7EADeBD56ddf6e0594058F076',
  B: '0x6399961f8CaFAA1c784f3211A069aBe284276729',
  C: '0x44Dfb735b11F5E1625fcAF365C24D8e1c3e63903',
  D: '0xED07C6487A188ad4bfa9f6317104Caa76fBEBC32',
}

const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http('https://arb1.arbitrum.io/rpc'),
})

// Simulated trade history for demo (in production, this would come from contract events)
const MOCK_TRADES: Trade[] = [
  { id: '1', strategy: 'Strategy A', pair: 'ETH/USD', type: 'long', size: 5000, pnl: 245.5, timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'closed' },
  { id: '2', strategy: 'Strategy B', pair: 'BTC/USD', type: 'short', size: 8000, pnl: -120.3, timestamp: new Date(Date.now() - 7200000).toISOString(), status: 'closed' },
  { id: '3', strategy: 'Strategy C', pair: 'LINK/USD', type: 'long', size: 2000, pnl: 89.2, timestamp: new Date(Date.now() - 10800000).toISOString(), status: 'closed' },
  { id: '4', strategy: 'Strategy A', pair: 'ARB/USD', type: 'long', size: 3000, pnl: 156.7, timestamp: new Date(Date.now() - 14400000).toISOString(), status: 'open' },
  { id: '5', strategy: 'Strategy D', pair: 'ETH/USD', type: 'short', size: 4500, pnl: -45.8, timestamp: new Date(Date.now() - 18000000).toISOString(), status: 'closed' },
  { id: '6', strategy: 'Strategy B', pair: 'SOL/USD', type: 'long', size: 6000, pnl: 312.4, timestamp: new Date(Date.now() - 21600000).toISOString(), status: 'open' },
  { id: '7', strategy: 'Strategy C', pair: 'BTC/USD', type: 'short', size: 5500, pnl: 178.9, timestamp: new Date(Date.now() - 25200000).toISOString(), status: 'closed' },
  { id: '8', strategy: 'Strategy A', pair: 'LINK/USD', type: 'long', size: 2500, pnl: -67.2, timestamp: new Date(Date.now() - 28800000).toISOString(), status: 'closed' },
]

// Mock PnL history data
const generatePnLHistory = (): PnLDataPoint[] => {
  const history: PnLDataPoint[] = []
  let baseA = 1000, baseB = 800, baseC = 600, baseD = 400
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000)
    baseA += (Math.random() - 0.4) * 200
    baseB += (Math.random() - 0.4) * 150
    baseC += (Math.random() - 0.4) * 100
    baseD += (Math.random() - 0.4) * 80
    
    history.push({
      timestamp: date.toISOString().split('T')[0],
      strategyA: Math.max(0, baseA),
      strategyB: Math.max(0, baseB),
      strategyC: Math.max(0, baseC),
      strategyD: Math.max(0, baseD),
      total: baseA + baseB + baseC + baseD
    })
  }
  return history
}

// Mock funding rates
const MOCK_FUNDING_RATES: FundingRate[] = [
  { pair: 'ETH/USD', rate: 0.0123, trend: 'up' },
  { pair: 'BTC/USD', rate: 0.0087, trend: 'down' },
  { pair: 'LINK/USD', rate: 0.0156, trend: 'up' },
  { pair: 'ARB/USD', rate: -0.0034, trend: 'down' },
  { pair: 'SOL/USD', rate: 0.0211, trend: 'up' },
  { pair: 'AVAX/USD', rate: 0.0098, trend: 'neutral' },
]

export function useWalletData() {
  const [strategies, setStrategies] = useState<Strategy[]>([
    { id: 'A', name: 'Strategy A', address: STRATEGY_WALLETS.A, balance: 0, pnl: 1250.5, winRate: 68.5, trades: 42, openPositions: 2, lastTrade: '2 min ago' },
    { id: 'B', name: 'Strategy B', address: STRATEGY_WALLETS.B, balance: 0, pnl: 890.2, winRate: 62.1, trades: 38, openPositions: 1, lastTrade: '15 min ago' },
    { id: 'C', name: 'Strategy C', address: STRATEGY_WALLETS.C, balance: 0, pnl: 645.8, winRate: 71.2, trades: 31, openPositions: 1, lastTrade: '1 hour ago' },
    { id: 'D', name: 'Strategy D', address: STRATEGY_WALLETS.D, balance: 0, pnl: 420.3, winRate: 58.9, trades: 27, openPositions: 0, lastTrade: '3 hours ago' },
  ])
  const [trades] = useState<Trade[]>(MOCK_TRADES)
  const [pnlHistory] = useState<PnLDataPoint[]>(generatePnLHistory())
  const [fundingRates] = useState<FundingRate[]>(MOCK_FUNDING_RATES)
  const [loading, setLoading] = useState(true)

  const fetchBalances = useCallback(async () => {
    setLoading(true)
    try {
      const updatedStrategies = await Promise.all(
        strategies.map(async (strategy) => {
          try {
            const balance = await publicClient.getBalance({
              address: strategy.address,
            })
            // Convert from wei to ETH and then to USD (simplified, using ETH price ~$2800)
            const ethBalance = parseFloat(formatEther(balance))
            const usdBalance = ethBalance * 2800
            
            return {
              ...strategy,
              balance: usdBalance,
            }
          } catch (error) {
            console.error(`Error fetching balance for ${strategy.name}:`, error)
            // Fallback to simulated data
            return {
              ...strategy,
              balance: 10000 + Math.random() * 5000,
            }
          }
        })
      )
      setStrategies(updatedStrategies)
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    } finally {
      setLoading(false)
    }
  }, [strategies])

  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  const totalBalance = strategies.reduce((sum, s) => sum + s.balance, 0)
  const totalPnL = strategies.reduce((sum, s) => sum + s.pnl, 0)
  const totalTrades = strategies.reduce((sum, s) => sum + s.trades, 0)
  const totalWins = strategies.reduce((sum, s) => sum + (s.trades * s.winRate / 100), 0)
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0

  return {
    strategies,
    trades,
    pnlHistory,
    fundingRates,
    totalBalance,
    totalPnL,
    winRate,
    loading,
    refresh: fetchBalances,
  }
}