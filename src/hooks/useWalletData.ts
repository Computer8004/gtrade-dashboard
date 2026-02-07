import { useQuery } from '@tanstack/react-query'
import { createPublicClient, http, formatUnits, type Address, parseAbi } from 'viem'
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
  currentPosition?: {
    pair: string
    direction: 'long' | 'short'
    size: number
    leverage: number
    entryPrice: number
  } | null
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
  entryPrice?: number
  exitPrice?: number
  exitReason?: string
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

// Trade struct types from gTrade contract
type OpenTrade = {
  trader: Address
  pairIndex: bigint
  index: bigint
  initialPosToken: bigint
  positionSizeUsdc: bigint
  openPrice: bigint
  buy: boolean
  leverage: bigint
  tp: bigint
  sl: bigint
}

type TradeHistoryItem = {
  trader: Address
  pairIndex: bigint
  index: bigint
  initialPosToken: bigint
  positionSizeUsdc: bigint
  openPrice: bigint
  buy: boolean
  leverage: bigint
  tp: bigint
  sl: bigint
  closePrice: bigint
  closeTime: bigint
  pnl: bigint
}

// Strategy wallet addresses
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

// ERC20 Balance ABI
const ERC20_BALANCE_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
])

// Minimal gTrade Diamond ABI for reading trades
const GTRADE_ABI = parseAbi([
  'function getTrades(address trader) view returns (tuple(address trader,uint256 pairIndex,uint256 index,uint256 initialPosToken,uint256 positionSizeUsdc,uint256 openPrice,bool buy,uint256 leverage,uint256 tp,uint256 sl)[])',
  'function getTradesHistory(address trader,uint256 offset,uint256 limit) view returns (tuple(address trader,uint256 pairIndex,uint256 index,uint256 initialPosToken,uint256 positionSizeUsdc,uint256 openPrice,bool buy,uint256 leverage,uint256 tp,uint256 sl,uint256 closePrice,uint256 closeTime,uint256 pnl)[])',
  'function pairName(uint256) view returns (string)',
])

// Borrowing fee ABI for funding rates
const BORROWING_FEE_ABI = parseAbi([
  'function getPairBorrowingFeeParams(uint256 collateralIndex,uint256 pairIndex) view returns (uint256 feePerSecond,uint256 accFeeLong,uint256 accFeeShort,uint256 accLastUpdatedBlock)',
])

// Create public client for Arbitrum Sepolia
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

// Fetch USDC balance for a wallet
async function fetchUSDCBalance(address: Address): Promise<number> {
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
    return 37500 // Default fallback
  }
}

// Fetch open trades for a wallet
async function fetchOpenTrades(trader: Address): Promise<Trade[]> {
  try {
    const rawTrades = await publicClient.readContract({
      address: GTRADE_DIAMOND,
      abi: GTRADE_ABI,
      functionName: 'getTrades',
      args: [trader],
    })
    const trades = rawTrades as OpenTrade[]

    const openTrades: Trade[] = []
    
    for (const trade of trades) {
      const pairName = await fetchPairName(trade.pairIndex)
      openTrades.push({
        id: `${trader}-${trade.pairIndex}-${trade.index}`,
        strategy: getStrategyId(trader),
        pair: pairName,
        type: trade.buy ? 'long' : 'short',
        size: Number(formatUnits(trade.positionSizeUsdc, 6)),
        pnl: 0, // Would need additional calculation for unrealized PnL
        timestamp: new Date().toISOString(), // Trade doesn't have open timestamp in basic struct
        status: 'open',
        entryPrice: Number(formatUnits(trade.openPrice, 10)), // Price is typically 10 decimals
      })
    }
    
    return openTrades
  } catch (error) {
    console.error(`Error fetching open trades for ${trader}:`, error)
    return []
  }
}

// Fetch trade history for a wallet
async function fetchTradeHistory(trader: Address, limit: number = 50): Promise<Trade[]> {
  try {
    const history = await publicClient.readContract({
      address: GTRADE_DIAMOND,
      abi: GTRADE_ABI,
      functionName: 'getTradesHistory',
      args: [trader, BigInt(0), BigInt(limit)],
    }) as TradeHistoryItem[]

    const trades: Trade[] = []
    
    for (const trade of history) {
      const pairName = await fetchPairName(trade.pairIndex)
      trades.push({
        id: `${trader}-${trade.pairIndex}-${trade.index}`,
        strategy: getStrategyId(trader),
        pair: pairName,
        type: trade.buy ? 'long' : 'short',
        size: Number(formatUnits(trade.positionSizeUsdc, 6)),
        pnl: Number(formatUnits(trade.pnl, 6)),
        timestamp: new Date(Number(trade.closeTime) * 1000).toISOString(),
        status: 'closed',
        entryPrice: Number(formatUnits(trade.openPrice, 10)),
        exitPrice: Number(formatUnits(trade.closePrice, 10)),
      })
    }
    
    return trades
  } catch (error) {
    console.error(`Error fetching trade history for ${trader}:`, error)
    return []
  }
}

// Fetch pair name from index
async function fetchPairName(pairIndex: bigint): Promise<string> {
  try {
    const name = await publicClient.readContract({
      address: GTRADE_DIAMOND,
      abi: GTRADE_ABI,
      functionName: 'pairName',
      args: [pairIndex],
    }) as string
    return name || `Pair-${pairIndex}`
  } catch (error) {
    // Fallback to common pairs
    const commonPair = COMMON_PAIRS.find(p => p.pairIndex === Number(pairIndex))
    return commonPair?.name || `Pair-${pairIndex}`
  }
}

// Get strategy ID from wallet address
function getStrategyId(address: Address): string {
  for (const [id, addr] of Object.entries(STRATEGY_WALLETS)) {
    if (addr.toLowerCase() === address.toLowerCase()) return id
  }
  return 'Unknown'
}

// Fetch funding rates from borrowing fees
async function fetchFundingRates(): Promise<FundingRate[]> {
  const rates: FundingRate[] = []
  const collateralIndex = 1 // USDC on Sepolia
  const SECONDS_PER_YEAR = 365 * 24 * 60 * 60

  for (const pair of COMMON_PAIRS) {
    try {
      const result = await publicClient.readContract({
        address: GTRADE_DIAMOND,
        abi: BORROWING_FEE_ABI,
        functionName: 'getPairBorrowingFeeParams',
        args: [BigInt(collateralIndex), BigInt(pair.pairIndex)],
      })

      const [feePerSecond] = result as [bigint, bigint, bigint, bigint]
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

// Main data fetching function
async function fetchDashboardData() {
  // Fetch all balances in parallel
  const balancePromises = Object.values(STRATEGY_WALLETS).map(addr => fetchUSDCBalance(addr))
  const openTradesPromises = Object.values(STRATEGY_WALLETS).map(addr => fetchOpenTrades(addr))
  const historyPromises = Object.values(STRATEGY_WALLETS).map(addr => fetchTradeHistory(addr, 20))
  
  const [balances, openTradesResults, historyResults, rates] = await Promise.all([
    Promise.all(balancePromises),
    Promise.all(openTradesPromises),
    Promise.all(historyPromises),
    fetchFundingRates(),
  ])

  // Build strategies array
  const strategies: Strategy[] = Object.keys(STRATEGY_WALLETS).map((id, index) => {
    const openTrades = openTradesResults[index]
    const history = historyResults[index]
    const balance = balances[index]
    
    // Calculate stats
    const allTrades = [...history, ...openTrades]
    const winningTrades = history.filter(t => t.pnl > 0).length
    const totalClosedTrades = history.length
    const winRate = totalClosedTrades > 0 ? (winningTrades / totalClosedTrades) * 100 : 0
    const totalPnl = history.reduce((sum, t) => sum + t.pnl, 0)
    
    // Get last trade timestamp
    const lastTrade = history.length > 0 
      ? new Date(history[0].timestamp).toLocaleString()
      : openTrades.length > 0
        ? 'Active now'
        : null
    
    // Current position (first open trade if any)
    const currentPosition = openTrades.length > 0 ? {
      pair: openTrades[0].pair,
      direction: openTrades[0].type,
      size: openTrades[0].size,
      leverage: 10, // Default, would need to fetch actual
      entryPrice: openTrades[0].entryPrice || 0,
    } : null
    
    return {
      id,
      name: `Strategy ${id} - ${getStrategyType(id)}`,
      address: STRATEGY_WALLETS[id],
      balance,
      pnl: totalPnl,
      winRate,
      trades: allTrades.length,
      openPositions: openTrades.length,
      lastTrade,
      currentPosition,
    }
  })

  // Combine all trades
  const allTrades: Trade[] = []
  for (const trades of [...historyResults, ...openTradesResults]) {
    allTrades.push(...trades)
  }
  
  // Sort by timestamp (most recent first)
  allTrades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Build PnL history (simplified - just show current totals)
  const now = new Date().toISOString().split('T')[0]
  const pnlHistory: PnLDataPoint[] = [{
    timestamp: now,
    strategyA: strategies[0]?.pnl || 0,
    strategyB: strategies[1]?.pnl || 0,
    strategyC: strategies[2]?.pnl || 0,
    strategyD: strategies[3]?.pnl || 0,
    total: strategies.reduce((sum, s) => sum + s.pnl, 0),
  }]

  return {
    strategies,
    trades: allTrades.slice(0, 50), // Last 50 trades
    pnlHistory,
    fundingRates: rates,
    totalBalance: strategies.reduce((sum, s) => sum + s.balance, 0),
    totalPnL: strategies.reduce((sum, s) => sum + s.pnl, 0),
  }
}

// Helper function to get strategy type name
function getStrategyType(id: string): string {
  const types: Record<string, string> = {
    A: 'Mean Reversion',
    B: 'Funding Arb',
    C: 'Momentum',
    D: 'Hybrid',
  }
  return types[id] || 'Trading'
}

// React Query hook
export function useWalletData() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['gtrade-dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: false,
    staleTime: 25000, // Consider data stale after 25 seconds
  })

  return {
    strategies: data?.strategies || [],
    trades: data?.trades || [],
    pnlHistory: data?.pnlHistory || [],
    fundingRates: data?.fundingRates || [],
    totalBalance: data?.totalBalance || 0,
    totalPnL: data?.totalPnL || 0,
    loading: isLoading,
    error,
    refresh: refetch,
  }
}
