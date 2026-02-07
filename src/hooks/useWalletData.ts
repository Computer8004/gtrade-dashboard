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

// gTrade Diamond on Sepolia
const GTRADE_DIAMOND = '0xd659a15812064C79E189fd950A189b15c75d3186'

const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// ABI for fetching borrowing fee data
const BORROWING_FEE_ABI = [
  {
    inputs: [
      { name: 'collateralIndex', type: 'uint256' },
      { name: 'pairIndex', type: 'uint256' }
    ],
    name: 'getPairBorrowingFeeParams',
    outputs: [
      { name: 'feePerSecond', type: 'uint256' },
      { name: 'accFeeLong', type: 'uint256' },
      { name: 'accFeeShort', type: 'uint256' },
      { name: 'accLastUpdatedBlock', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
})

// Common pairs with their indices
const COMMON_PAIRS = [
  { name: 'BTC/USD', pairIndex: 0 },
  { name: 'ETH/USD', pairIndex: 1 },
  { name: 'LINK/USD', pairIndex: 2 },
  { name: 'DOGE/USD', pairIndex: 4 },
  { name: 'MATIC/USD', pairIndex: 5 },
  { name: 'SOL/USD', pairIndex: 32 },
]

// Fetch funding rates directly from gTrade
async function fetchRealFundingRates(): Promise<FundingRate[]> {
  const rates: FundingRate[] = []
  const collateralIndex = 1 // DAI on Sepolia
  const SECONDS_PER_YEAR = 365 * 24 * 60 * 60

  for (const pair of COMMON_PAIRS) {
    try {
      const result = await publicClient.readContract({
        address: GTRADE_DIAMOND,
        abi: BORROWING_FEE_ABI,
        functionName: 'getPairBorrowingFeeParams',
        args: [BigInt(collateralIndex), BigInt(pair.pairIndex)],
      }) as [bigint, bigint, bigint, bigint]

      const [feePerSecond] = result
      const feePerSecondNum = Number(feePerSecond) / 1e10
      const apr = feePerSecondNum * SECONDS_PER_YEAR * 100

      rates.push({
        pair: pair.name,
        longRate: apr,
        shortRate: apr,
      })
    } catch (err) {
      // Skip pairs that error
    }
  }

  return rates.sort((a, b) => Math.max(Math.abs(b.longRate), Math.abs(b.shortRate)) - Math.max(Math.abs(a.longRate), Math.abs(a.shortRate)))
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
    const now = Date.now()
    if (now - lastFetchRef.current < 5000) return
    lastFetchRef.current = now

    if (!initialLoadDone) {
      setLoading(true)
    }
    
    try {
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
            return 37500
          }
        })
      )

      const rates = await fetchRealFundingRates()
      setFundingRates(rates)

      setStrategies(prev => prev.map((strategy, idx) => ({
        ...strategy,
        balance: balances[idx],
        pnl: balances[idx] - 37500,
      })))

      const today = new Date().toISOString().split('T')[0]
      setPnlHistory([{
        timestamp: today,
        strategyA: balances[0] - 37500,
        strategyB: balances[1] - 37500,
        strategyC: balances[2] - 37500,
        strategyD: balances[3] - 37500,
        total: balances.reduce((a, b) => a + b, 0) - 150000,
      }])

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

  return {
    strategies,
    trades,
    pnlHistory,
    fundingRates,
    totalBalance,
    totalPnL,
    loading,
    refresh: fetchBalances,
  }
}
