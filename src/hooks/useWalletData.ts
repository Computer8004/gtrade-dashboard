import { useState, useEffect, useCallback, useRef } from 'react'
import { createPublicClient, http, formatUnits, type Address } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

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
  longRate: number
  shortRate: number
}

const STRATEGY_WALLETS: Record<string, Address> = {
  A: '0xc9DB0FaddED889f7EADeBD56ddf6e0594058F076',
  B: '0x6399961f8CaFAA1c784f3211A069aBe284276729',
  C: '0x44Dfb735b11F5E1625fcAF365C24D8e1c3e63903',
  D: '0xED07C6487A188ad4bfa9f6317104Caa76fBEBC32',
}

// GNS_TEST_USDC on Arbitrum Sepolia
const USDC_CONTRACT = '0x4cC7EbEeD5EA3adf3978F19833d2E1f3e8980cD6'

const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
})

// Fetch real funding rates from our util
async function fetchRealFundingRates(): Promise<FundingRate[]> {
  try {
    const { fetchHoldingRates } = await import('../../../gtrade-bot/src/utils/holding-rates')
    const rates = await fetchHoldingRates('arbitrum-sepolia')
    return rates.slice(0, 6).map(r => ({
      pair: r.pair,
      longRate: r.longAPR,
      shortRate: r.shortAPR,
    }))
  } catch (error) {
    console.error('Error fetching funding rates:', error)
    return []
  }
}

export function useWalletData() {
  const [strategies, setStrategies] = useState<Strategy[]>([
    { id: 'A', name: 'Strategy A - Mean Reversion', address: STRATEGY_WALLETS.A, balance: 37500, pnl: 0, winRate: 0, trades: 0, openPositions: 0, lastTrade: null },
    { id: 'B', name: 'Strategy B - Funding Arb', address: STRATEGY_WALLETS.B, balance: 37500, pnl: 0, winRate: 0, trades: 0, openPositions: 0, lastTrade: null },
    { id: 'C', name: 'Strategy C - Momentum', address: STRATEGY_WALLETS.C, balance: 37500, pnl: 0, winRate: 0, trades: 0, openPositions: 0, lastTrade: null },
    { id: 'D', name: 'Strategy D - Hybrid', address: STRATEGY_WALLETS.D, balance: 37500, pnl: 0, winRate: 0, trades: 0, openPositions: 0, lastTrade: null },
  ])
  const [trades, setTrades] = useState<Trade[]>([])
  const [pnlHistory, setPnlHistory] = useState<PnLDataPoint[]>([])
  const [fundingRates, setFundingRates] = useState<FundingRate[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const lastFetchRef = useRef<number>(0)

  const fetchBalances = useCallback(async () => {
    // Prevent rapid re-fetches (min 5 seconds between calls)
    const now = Date.now()
    if (now - lastFetchRef.current < 5000) return
    lastFetchRef.current = now

    if (!initialLoadDone) {
      setLoading(true)
    }
    
    try {
      // Fetch USDC balances for all wallets
      const balances = await Promise.all(
        Object.values(STRATEGY_WALLETS).map(async (address) => {
          try {
            const balance = await publicClient.readContract({
              address: USDC_CONTRACT,
              abi: ERC20_BALANCE_ABI,
              functionName: 'balanceOf',
              args: [address],
            })
            return Number(formatUnits(balance, 6))
          } catch (error) {
            console.error(`Error fetching balance for ${address}:`, error)
            return 37500 // Fallback to expected amount
          }
        })
      )

      // Fetch funding rates
      const rates = await fetchRealFundingRates()
      setFundingRates(rates)

      // Update strategies with real balances
      setStrategies(prev => prev.map((strategy, idx) => ({
        ...strategy,
        balance: balances[idx],
        // PnL is balance - initial funding (37500)
        pnl: balances[idx] - 37500,
      })))

      // Build PnL history from current state
      const today = new Date().toISOString().split('T')[0]
      setPnlHistory([{
        timestamp: today,
        strategyA: balances[0] - 37500,
        strategyB: balances[1] - 37500,
        strategyC: balances[2] - 37500,
        strategyD: balances[3] - 37500,
        total: balances.reduce((a, b) => a + b, 0) - 150000,
      }])

      // In the future, fetch real trades from gTrade contract events
      // For now, trades array stays empty until we have real data
      setTrades([])

    } catch (error) {
      console.error('Error fetching wallet data:', error)
    } finally {
      setLoading(false)
      setInitialLoadDone(true)
    }
  }, [initialLoadDone])

  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  const totalBalance = strategies.reduce((sum, s) => sum + s.balance, 0)
  const totalPnL = strategies.reduce((sum, s) => sum + s.pnl, 0)
  const totalTrades = strategies.reduce((sum, s) => sum + s.trades, 0)
  const winRate = totalTrades > 0 
    ? (strategies.reduce((sum, s) => sum + (s.trades * s.winRate / 100), 0) / totalTrades) * 100 
    : 0

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
