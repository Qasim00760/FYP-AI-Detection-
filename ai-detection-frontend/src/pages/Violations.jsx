import React, { useState, useEffect } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://qasimktk-ai-detection-backend.hf.space'

function Violations() {
  const [violations, setViolations] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [dateFrom, setDateFrom]     = useState('')
  const [dateTo, setDateTo]         = useState('')

  useEffect(() => { fetchViolations() }, [])

  const fetchViolations = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BACKEND.trim().replace(/\/+$/, '')}/violations`)
      const data = await res.json()
      setViolations(data.violations || [])
    } catch {
      setViolations([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = violations.filter(v => {
    const matchSearch = !search ||
      (v.vehicle_number || '').toLowerCase().includes(search.toLowerCase())
    const ts = v.timestamp || ''
    const matchFrom = !dateFrom || ts >= dateFrom
    const matchTo   = !dateTo   || ts <= dateTo + ' 23:59:59'
    return matchSearch && matchFrom && matchTo
  })

  const downloadCSV = () => {
    if (!filtered.length) return
    const cols = Object.keys(filtered[0])
    const rows = [cols.join(','), ...filtered.map(r => cols.map(c => `"${r[c] || ''}"`).join(','))]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `violations_${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-slate-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-900">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white flex items-center gap-3">
              📋 Violation Records
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              All detected helmet violations — {violations.length} total
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchViolations}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-all border border-slate-700">
              🔄 Refresh
            </button>
            <button onClick={downloadCSV}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-all">
              ⬇️ Download CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
              🔍 Search by Plate
            </label>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="e.g. LEA1234"
              className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
              📅 From Date
            </label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
              📅 To Date
            </label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Loading violations...
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-5 py-4 text-left">#</th>
                  <th className="px-5 py-4 text-left">ID</th>
                  <th className="px-5 py-4 text-left">Vehicle Plate</th>
                  <th className="px-5 py-4 text-left">Helmet Status</th>
                  <th className="px-5 py-4 text-left">Helmet Conf %</th>
                  <th className="px-5 py-4 text-left">OCR Conf %</th>
                  <th className="px-5 py-4 text-left">Timestamp</th>
                  <th className="px-5 py-4 text-left">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((v, idx) => {
                  const isViolation = (v.helmet_status || '').toLowerCase().includes('without')
                  return (
                    <tr key={idx}
                      className={`transition-colors ${isViolation ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'bg-slate-950/40 hover:bg-slate-900/60'}`}>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{idx + 1}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{v.id || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-3 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-xs">
                          {v.vehicle_number || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          isViolation
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {v.helmet_status || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-300">
                        {v.helmet_confidence ? `${parseFloat(v.helmet_confidence).toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-300">
                        {v.ocr_confidence ? `${parseFloat(v.ocr_confidence).toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{v.timestamp || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-xs">
                          {v.source_type || '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="text-5xl">📋</div>
            <h3 className="text-xl font-bold text-white">No Violations Found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              {search || dateFrom || dateTo
                ? 'No records match your filters. Try adjusting the search criteria.'
                : 'Violations will appear here after detections are made via the AI Detection dashboard.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Violations
