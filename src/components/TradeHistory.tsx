import { History, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react'
import type { Trade } from '../hooks/useWalletData'

interface TradeHistoryProps {
  trades: Trade[]
  loading: boolean
}

export function TradeHistory({ trades, loading }: TradeHistoryProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    
    if (hours > 0) return `${hours}h ${minutes}m ago`
    return `${minutes}m ago`
  }

  return (
    <div className="glass rounded-2xl border border-slate-800/50 overflow-hidden">
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            Recent Trades
          </h2>
          <span className="text-xs text-slate-400">Last 24h</span>
        </div>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-slate-400">
            <div className="animate-pulse">Loading trades...</div>
          </div>
        ) : trades.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            No recent trades
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {trades.map((trade) => (
              <div
                key={trade.id}
                className="p-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Type indicator */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      trade.type === 'long' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {trade.type === 'long' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{trade.pair}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          trade.type === 'long' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {trade.type.toUpperCase()}
                        </span>
                        {trade.status === 'open' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            OPEN
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{trade.strategy}</span>
                        <span>•</span>
                        <span>${trade.size.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-semibold ${
                      trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(trade.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}