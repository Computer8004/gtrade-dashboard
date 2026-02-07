import { Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import type { FundingRate } from '../hooks/useWalletData'

interface FundingRatesProps {
  rates: FundingRate[]
  loading: boolean
}

export function FundingRates({ rates, loading }: FundingRatesProps) {
  // Find best long and short opportunities
  const bestLong = rates.length > 0 
    ? rates.reduce((best, r) => r.shortRate < best.shortRate ? r : best, rates[0])
    : null
  const bestShort = rates.length > 0
    ? rates.reduce((best, r) => r.longRate < best.longRate ? r : best, rates[0])
    : null

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
              <p className="text-xs text-slate-400">Live from gTrade Oracle</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading && rates.length === 0 ? (
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
            Loading funding rates...
          </div>
        ) : (
          <div className="space-y-2">
            {rates.map((rate) => (
              <div
                key={rate.pair}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 group-hover:bg-slate-700 transition-colors">
                    {rate.pair.split('/')[0].slice(0, 3)}
                  </div>
                  <span className="font-medium text-white">{rate.pair}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Long rate */}
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Long</span>
                    <span className={`font-mono text-sm ${rate.longRate < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {rate.longRate > 0 ? '+' : ''}{rate.longRate.toFixed(2)}%
                    </span>
                  </div>
                  {/* Short rate */}
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Short</span>
                    <span className={`font-mono text-sm ${rate.shortRate < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {rate.shortRate > 0 ? '+' : ''}{rate.shortRate.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Best opportunities */}
        {bestLong && bestShort && (
          <div className="mt-6 pt-4 border-t border-slate-800/50 space-y-2">
            <p className="text-xs text-slate-500 mb-2">Best Opportunities:</p>
            {bestLong.shortRate < 0 && (
              <div className="flex items-center gap-2 text-sm">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">Long {bestLong.pair}</span>
                <span className="text-emerald-400 font-mono">{bestLong.shortRate.toFixed(2)}% APR</span>
              </div>
            )}
            {bestShort.longRate < 0 && (
              <div className="flex items-center gap-2 text-sm">
                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">Short {bestShort.pair}</span>
                <span className="text-emerald-400 font-mono">{bestShort.longRate.toFixed(2)}% APR</span>
              </div>
            )}
          </div>
        )}

        {/* Info section */}
        <div className="mt-6 pt-4 border-t border-slate-800/50">
          <div className="bg-slate-800/30 rounded-lg p-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="text-amber-400 font-medium">Negative rates</span> mean you GET PAID to hold that position. 
              Strategy B (Funding Arb) hunts these opportunities.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
