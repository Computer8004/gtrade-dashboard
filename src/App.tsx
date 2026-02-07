import { useEffect, useState } from 'react'
import './index.css'
import { StrategyCard } from './components/StrategyCard'
import { TradeHistory } from './components/TradeHistory'
import { PnLChart } from './components/PnLChart'
import { FundingRates } from './components/FundingRates'
import { useWalletData } from './hooks/useWalletData'
import { Activity, TrendingUp, Wallet, Clock, RefreshCw } from 'lucide-react'

function App() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const {
    strategies,
    trades,
    pnlHistory,
    fundingRates,
    totalBalance,
    totalPnL,
    winRate,
    refresh,
    loading
  } = useWalletData()

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setLastUpdate(new Date())
    setIsRefreshing(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center glow-accent">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">gTrade Dashboard</h1>
                <p className="text-xs text-slate-400">Live Strategy Monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass rounded-2xl p-6 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-slate-400 text-sm">Total Balance</span>
            </div>
            <p className="text-3xl font-bold text-white">
              ${loading ? '...' : totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-1">Across all strategies</p>
          </div>

          <div className="glass rounded-2xl p-6 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-slate-400 text-sm">Total P&L</span>
            </div>
            <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {loading ? '...' : `${totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
            <p className="text-xs text-slate-500 mt-1">Lifetime performance</p>
          </div>

          <div className="glass rounded-2xl p-6 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-slate-400 text-sm">Win Rate</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {loading ? '...' : `${winRate.toFixed(1)}%`}
            </p>
            <p className="text-xs text-slate-500 mt-1">Strategy accuracy</p>
          </div>
        </div>

        {/* Strategy Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-cyan-500 to-purple-600 rounded-full"></div>
            Strategy Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {strategies.map((strategy, index) => (
              <StrategyCard
                key={strategy.address}
                strategy={strategy}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* PnL Chart */}
        <div className="mb-8">
          <PnLChart data={pnlHistory} loading={loading} />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trade History */}
          <TradeHistory trades={trades} loading={loading} />
          
          {/* Funding Rates */}
          <FundingRates rates={fundingRates} loading={loading} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          <p>gTrade Dashboard • Auto-refresh every 30 seconds</p>
        </div>
      </footer>
    </div>
  )
}

export default App