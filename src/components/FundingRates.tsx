import { Zap, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react'
import type { FundingRate } from '../hooks/useWalletData'

interface FundingRatesProps {
  rates: FundingRate[]
  loading: boolean
}

export function FundingRates({ rates, loading }: FundingRatesProps) {
  const getTrendIcon = (trend: FundingRate['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-rose-400" />
      default:
        return <Minus className="w-4 h-4 text-slate-400" />
    }
  }

  const getTrendColor = (trend: FundingRate['trend']) => {
    switch (trend) {
      case 'up':
        return 'text-emerald-400'
      case 'down':
        return 'text-rose-400'
      default:
        return 'text-slate-400'
    }
  }

  return (
    <div className="glass rounded-2xl border border-slate-800/50 overflow-hidden">
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Funding Rates</h2>
              <p className="text-xs text-slate-400">Real-time market data</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <RefreshCw className="w-3 h-3" />
            <span>Live</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-3">
                <div className="h-4 bg-slate-800 rounded w-20"></div>
                <div className="h-4 bg-slate-800 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : rates.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            No funding rate data available
          </div>
        ) : (
          <div className="space-y-2">
            {rates.map((rate) => (
              <div
                key={rate.pair}
                className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-slate-800/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 group-hover:bg-slate-700 transition-colors">
                    {rate.pair.split('/')[0].slice(0, 3)}
                  </div>
                  <span className="font-medium text-white">{rate.pair}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-semibold ${
                    rate.rate > 0 ? 'text-emerald-400' : rate.rate < 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}>
                    {rate.rate > 0 ? '+' : ''}{(rate.rate * 100).toFixed(4)}%
                  </span>
                  <div className={`flex items-center gap-1 ${getTrendColor(rate.trend)}`}>
                    {getTrendIcon(rate.trend)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info section */}
        <div className="mt-6 pt-4 border-t border-slate-800/50">
          <div className="bg-slate-800/30 rounded-lg p-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="text-amber-400 font-medium">Funding rates</span> are periodic payments between long and short traders. 
              Positive rates mean longs pay shorts; negative rates mean shorts pay longs.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}