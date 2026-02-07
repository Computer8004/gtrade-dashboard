import { type Address } from 'viem'

// gTrade contract addresses on Arbitrum
export const GTRADE_CONTRACTS = {
  // Storage contract for reading positions
  storage: '0xF296F4ca6A5725E60C7fB28A8a96E59570C4B9c5' as Address,
  // Trading contract
  trading: '0x298e205d8bc955489f1527daDF912b5768f4c160' as Address,
  // Pair Info contract
  pairInfo: '0x7d8ba613b5b13703ccdd0c54a46b73d28115c04f' as Address,
} as const

// Strategy wallet addresses
export const STRATEGY_WALLETS = {
  A: '0xc9DB0FaddED889f7EADeBD56ddf6e0594058F076' as Address,
  B: '0x6399961f8CaFAA1c784f3211A069aBe284276729' as Address,
  C: '0x44Dfb735b11F5E1625fcAF365C24D8e1c3e63903' as Address,
  D: '0xED07C6487A188ad4bfa9f6317104Caa76fBEBC32' as Address,
} as const

// ABI fragments for reading positions
export const GTRADE_ABI = [
  // Get open limit orders
  {
    inputs: [{ name: 'trader', type: 'address' }],
    name: 'getOpenLimitOrders',
    outputs: [
      {
        components: [
          { name: 'trader', type: 'address' },
          { name: 'pairIndex', type: 'uint256' },
          { name: 'index', type: 'uint256' },
          { name: 'positionSize', type: 'uint256' },
          { name: 'spreadReductionP', type: 'uint256' },
          { name: 'buy', type: 'bool' },
          { name: 'leverage', type: 'uint256' },
          { name: 'tp', type: 'uint256' },
          { name: 'sl', type: 'uint256' },
          { name: 'minPrice', type: 'uint256' },
          { name: 'maxPrice', type: 'uint256' },
          { name: 'block', type: 'uint256' },
          { name: 'tokenId', type: 'uint256' },
        ],
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Get open trades
  {
    inputs: [
      { name: 'trader', type: 'address' },
      { name: 'pairIndex', type: 'uint256' },
      { name: 'index', type: 'uint256' },
    ],
    name: 'openTrades',
    outputs: [
      {
        components: [
          { name: 'trader', type: 'address' },
          { name: 'pairIndex', type: 'uint256' },
          { name: 'index', type: 'uint256' },
          { name: 'initialPosToken', type: 'uint256' },
          { name: 'positionSizeUsdc', type: 'uint256' },
          { name: 'openPrice', type: 'uint256' },
          { name: 'buy', type: 'bool' },
          { name: 'leverage', type: 'uint256' },
          { name: 'tp', type: 'uint256' },
          { name: 'sl', type: 'uint256' },
        ],
        name: 'trade',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Get pair names
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'pairName',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Get number of pairs
  {
    inputs: [],
    name: 'pairsCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Token ABI for USDC balance
export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// USDC on Arbitrum
export const USDC_ADDRESS = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8' as Address

// Common trading pairs on gTrade
export const TRADING_PAIRS = [
  'BTC/USD',
  'ETH/USD',
  'LINK/USD',
  'UNI/USD',
  'AAVE/USD',
  'COMP/USD',
  'SNX/USD',
  'CRV/USD',
  'MKR/USD',
  'YFI/USD',
  'SUSHI/USD',
  '1INCH/USD',
  'AVAX/USD',
  'MATIC/USD',
  'SOL/USD',
  'ARB/USD',
  'OP/USD',
  'DOGE/USD',
] as const

// Helper to format large numbers
export function formatUsd(value: bigint, decimals: number = 6): string {
  const divisor = BigInt(10 ** decimals)
  const whole = value / divisor
  const fraction = value % divisor
  const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 2)
  return `$${whole.toString()}.${fractionStr}`
}

// Helper to format leverage
export function formatLeverage(value: bigint): string {
  return `${(Number(value) / 1000).toFixed(1)}x`
}