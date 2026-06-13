import React, { useState, useEffect } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://qasimktk-ai-detection-backend.hf.space'

function StatsPage() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BACKEND.trim().replace(/\/+$/, '')}/stats`)
      const data = await res.json()
      setStats(data)
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const cards = stats ? [
    { label: 'Total Violations',   value: stats.total_violations  ?? 0, icon: '🚨', color: 'rose'    },
    { label: 'Total Challans',     value: stats.total_challans    ?? 0, icon: '🎫', color: 'amber'   },
    { label: 'Pending Challans',   value: stats.pending_challans  ?? 0, icon: '⏳', color: 'orange'  },
    { label: 'Paid Challans',      value: stats.paid_challans     ?? 0, icon: '✅', color: 'emerald' },
    { label: 'Today Violations',   value: stats.today_violations  ?? 0, icon: '📅', color: 'blue'    },
    { label: 'Today Challans',     value: stats.today_challans    ?? 0, icon: '📅', color: 'indigo'  },
    { label: 'Unique Vehicles',    value: stats.unique_vehicles   ?? 0, icon: '🚗', color: 'purple'  },
    { label: 'Amount Collected',   value: `Rs. ${(stats.total_amount_collected ?? 0).toLocaleString()}`, icon: '💰', color: 'teal' },
  ] : []

  const colorMap = {
    rose:    { border: 'border-rose-500/20',    text: 'text-rose-400'    },
    amber:   { border: 'border-amber-500/20',   text: 'text-amber-400'   },
    orange:  { border: 'border-orange-500/20',  text: 'text-orange-400'  },
    emerald: { border: 'border-emerald-500/20', text: 'text-emerald-400' },
    blue:    { border: 'border-blue-500/20',    text: 'text-blue-400'    },
    indigo:  { border: 'border-indigo-500/20',  text: 'text-indigo-400'  },
    purple:  { border: 'border-purple-500/20',  text: 'text-purple-400'  },
    teal:    { border: 'border-teal-500/20',    text: 'text-teal-400'    },
  }

  return (
    <div className="bg-slate-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-900">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white flex items-center gap-3">
              📊 System Statistics
            </h1>
            <p className="text-slate-400 text-sm mt-1">Live overview of all detection and challan activity</p>
          </div>
          <button onClick={fetchStats}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-all">
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Loading statistics...
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {cards.map((card, idx) => {
                const c = colorMap[card.color]
                return (
                  <div key={idx} className={`bg-slate-900 border ${c.border} rounded-xl p-6 shadow-xl space-y-3`}>
                    <div className="text-3xl">{card.icon}</div>
                    <div>
                      <div className={`text-2xl font-extrabold font-display ${c.text}`}>
                        {card.value}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{card.label}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Challan Breakdown Bar */}
            {stats.total_challans > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white">Challan Status Breakdown</h3>
                <div className="flex gap-2 h-6 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 transition-all duration-700"
                    style={{ width: `${((stats.paid_challans / stats.total_challans) * 100).toFixed(1)}%` }}
                    title={`Paid: ${stats.paid_challans}`}
                  />
                  <div
                    className="bg-amber-500 flex-1"
                    title={`Pending: ${stats.pending_challans}`}
                  />
                </div>
                <div className="flex gap-6 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    Paid ({stats.paid_challans})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                    Pending ({stats.pending_challans})
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="text-5xl">📊</div>
            <h3 className="text-xl font-bold text-white">No Stats Available</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Statistics will populate once the backend is connected and detections are performed.
            </p>
          </div>
        )}

        {/* Model Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Helmet Model',  accuracy: 94, icon: '🪖', color: 'blue'    },
            { name: 'Plate Model',   accuracy: 91, icon: '🚗', color: 'indigo'  },
            { name: 'Person Model',  accuracy: 96, icon: '👤', color: 'emerald' },
          ].map((m, idx) => {
            const c = colorMap[m.color] || colorMap.blue
            return (
              <div key={idx} className={`bg-slate-900 border ${c.border} rounded-xl p-6 space-y-4`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{m.icon}</span>
                  <div>
                    <div className="font-bold text-white">{m.name}</div>
                    <div className="text-xs text-slate-400">YOLOv8 Custom Trained</div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>Accuracy</span>
                    <span className={`font-bold ${c.text}`}>{m.accuracy}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-700 ${
                      m.color === 'blue' ? 'bg-blue-500' :
                      m.color === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500'
                    }`} style={{ width: `${m.accuracy}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

export default StatsPage
