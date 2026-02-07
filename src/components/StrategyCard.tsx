import { Wallet, TrendingUp, TrendingDown, Activity, Clock, Target } from 'lucide-react'
import type { Strategy } from '../hooks/useWalletData'

interface StrategyCardProps {
  strategy: Strategy
  index: number
}

const STRATEGY_COLORS = [
  { from: 'from-cyan-500', to: 'to-blue-500', accent: 'cyan' },
  { from: 'from-purple-500', to: 'to-pink-500', accent: 'purple' },
  { from: 'from-emerald-500', to: 'to-teal-500', accent: 'emerald' },
  { from: 'from-orange-500', to: 'to-red-500', accent: 'orange' },
]

export function StrategyCard({ strategy, index }: StrategyCardProps) {
  const colors = STRATEGY_COLORS[index % STRATEGY_COLORS.length]
  const isProfitable = strategy.pnl >= 0

  return (
    <div className="glass rounded-xl p-5 border border-slate-800/50 hover:border-slate-700/50 transition-all duration-300 hover:scale-[1.02] group animate-slide-in" style={{ animationDelay: `${index * 100}ms` }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:shadow-${colors.accent}-500/30 transition-shadow`}>
            {strategy.id}
          </div>
          <div>
            <h3 className="font-semibold text-white">{strategy.name}</h3>
            <p className="text-xs text-slate-400 font-mono">
              {strategy.address.slice(0, 6)}...{strategy.address.slice(-4)}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isProfitable ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{isProfitable ? '+' : ''}{((strategy.pnl / strategy.balance) * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
          <Wallet className="w-3 h-3" />
          <span>Balance</span>
        </div>
        <p className="text-2xl font-bold text-white">
          ${strategy.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
            <Activity className="w-3 h-3" />
            <span>Trades</span>
          </div>
          <p className="text-sm font-semibold text-white">{strategy.trades}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
            <Target className="w-3 h-3" />
            <span>Win Rate</span>
          </div>
          <p className="text-sm font-semibold text-white">{strategy.winRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* PnL */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">P&L:</span>
          <span className={`text-sm font-semibold ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isProfitable ? '+' : ''}${strategy.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>{strategy.lastTrade || 'No trades'}</span>
        </div>
      </div>

      {/* Open Positions Badge */}
      {strategy.openPositions > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            {strategy.openPositions} Open Position{strategy.openPositions > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}