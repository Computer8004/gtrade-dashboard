import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendingUp, Calendar, Filter } from 'lucide-react'
import type { PnLDataPoint } from '../hooks/useWalletData'

interface PnLChartProps {
  data: PnLDataPoint[]
  loading: boolean
}

const TIME_RANGES = [
  { label: '7D', value: 7 },
  { label: '14D', value: 14 },
  { label: '30D', value: 30 },
]

export function PnLChart({ data, loading }: PnLChartProps) {
  const [timeRange, setTimeRange] = useState(30)
  const [showStrategies, setShowStrategies] = useState({
    strategyA: true,
    strategyB: true,
    strategyC: true,
    strategyD: true,
  })

  const filteredData = data.slice(-timeRange)
  
  const totalPnL = filteredData.length > 0 
    ? filteredData[filteredData.length - 1].total - filteredData[0].total 
    : 0

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 border border-slate-800/50">
        <div className="h-[300px] flex items-center justify-center text-slate-400">
          <div className="animate-pulse">Loading chart...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl border border-slate-800/50 overflow-hidden">
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">P&L Performance</h2>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-500">{TIME_RANGES.find(r => r.value === timeRange)?.label}</span>
              </div>
            </div>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div className="flex bg-slate-800/50 rounded-lg p-1">
              {TIME_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    timeRange === range.value
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Strategy Toggles */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Filter className="w-3 h-3" />
            <span>Strategies:</span>
          </div>
          {[
            { key: 'strategyA', label: 'A', color: '#06b6d4' },
            { key: 'strategyB', label: 'B', color: '#8b5cf6' },
            { key: 'strategyC', label: 'C', color: '#10b981' },
            { key: 'strategyD', label: 'D', color: '#f59e0b' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setShowStrategies(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all ${
                showStrategies[key as keyof typeof showStrategies]
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-500'
              }`}
            >
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: color, opacity: showStrategies[key as keyof typeof showStrategies] ? 1 : 0.3 }}
              />
              Strategy {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                stroke="#475569" 
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getMonth() + 1}/${date.getDate()}`
                }}
              />
              <YAxis 
                stroke="#475569" 
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
                        <p className="text-xs text-slate-400 mb-2">{label}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: ${Number(entry.value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </p>
                        ))}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span className="text-slate-400 text-xs">{value}</span>}
              />
              
              {/* Total PnL Area */}
              <Area
                type="monotone"
                dataKey="total"
                name="Total P&L"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#colorTotal)"
              />
              
              {/* Individual Strategies */}
              {showStrategies.strategyA && (
                <Area
                  type="monotone"
                  dataKey="strategyA"
                  name="Strategy A"
                  stroke="#06b6d4"
                  strokeWidth={1.5}
                  fill="url(#colorA)"
                />
              )}
              {showStrategies.strategyB && (
                <Area
                  type="monotone"
                  dataKey="strategyB"
                  name="Strategy B"
                  stroke="#8b5cf6"
                  strokeWidth={1.5}
                  fill="url(#colorB)"
                />
              )}
              {showStrategies.strategyC && (
                <Area
                  type="monotone"
                  dataKey="strategyC"
                  name="Strategy C"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  fill="url(#colorC)"
                />
              )}
              {showStrategies.strategyD && (
                <Area
                  type="monotone"
                  dataKey="strategyD"
                  name="Strategy D"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  fill="url(#colorD)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}