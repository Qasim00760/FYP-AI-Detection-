import React, { useState, useEffect } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://qasimktk-ai-detection-backend.hf.space'

function Challans() {
  const [challans, setChallans]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [markingId, setMarkingId] = useState(null)
  const [message, setMessage]     = useState(null)

  useEffect(() => { fetchChallans() }, [])

  const fetchChallans = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BACKEND.trim().replace(/\/+$/, '')}/challans`)
      const data = await res.json()
      setChallans(data.challans || [])
    } catch {
      setChallans([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (challanNumber) => {
    setMarkingId(challanNumber)
    setMessage(null)
    try {
      const res = await fetch(`${BACKEND.trim().replace(/\/+$/, '')}/mark-paid`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ challan_number: challanNumber }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed')
      }
      setMessage({ type: 'success', text: `✅ Challan ${challanNumber} marked as paid!` })
      await fetchChallans()
    } catch (err) {
      setMessage({ type: 'error', text: `❌ ${err.message}` })
    } finally {
      setMarkingId(null)
    }
  }

  const downloadCSV = () => {
    if (!challans.length) return
    const cols = Object.keys(challans[0])
    const rows = [cols.join(','), ...challans.map(r => cols.map(c => `"${r[c] || ''}"`).join(','))]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `challans_${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  // Summary stats
  const total      = challans.length
  const pending    = challans.filter(c => c.status === 'pending').length
  const paid       = challans.filter(c => c.status === 'paid').length
  const totalAmt   = challans
    .filter(c => c.status === 'paid')
    .reduce((acc, c) => acc + (parseFloat(c.amount) || 0), 0)

  return (
    <div className="bg-slate-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-900">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white flex items-center gap-3">
              🎫 Challan Records
            </h1>
            <p className="text-slate-400 text-sm mt-1">All issued challans for helmet violations</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchChallans}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-all border border-slate-700">
              🔄 Refresh
            </button>
            <button onClick={downloadCSV}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-all">
              ⬇️ Download CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Challans',     value: total,                     color: 'blue',    icon: '📄' },
            { label: 'Pending',            value: pending,                   color: 'amber',   icon: '⏳' },
            { label: 'Paid',               value: paid,                      color: 'emerald', icon: '✅' },
            { label: 'Amount Collected',   value: `Rs. ${totalAmt.toLocaleString()}`, color: 'indigo', icon: '💰' },
          ].map((s, i) => {
            const cm = {
              blue:    'border-blue-500/20 text-blue-400',
              amber:   'border-amber-500/20 text-amber-400',
              emerald: 'border-emerald-500/20 text-emerald-400',
              indigo:  'border-indigo-500/20 text-indigo-400',
            }
            return (
              <div key={i} className={`bg-slate-900 border ${cm[s.color].split(' ')[0]} rounded-xl p-5 shadow-lg`}>
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className={`text-2xl font-extrabold font-display ${cm[s.color].split(' ')[1]}`}>{s.value}</div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </div>
            )
          })}
        </div>

        {/* Flash message */}
        {message && (
          <div className={`rounded-lg p-3 text-sm font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Loading challans...
          </div>
        ) : challans.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-5 py-4 text-left">#</th>
                  <th className="px-5 py-4 text-left">Challan No.</th>
                  <th className="px-5 py-4 text-left">Vehicle Plate</th>
                  <th className="px-5 py-4 text-left">Fine Amount</th>
                  <th className="px-5 py-4 text-left">Issued On</th>
                  <th className="px-5 py-4 text-left">Paid On</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  <th className="px-5 py-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {challans.map((c, idx) => {
                  const isPaid = c.status === 'paid'
                  return (
                    <tr key={idx}
                      className={`transition-colors ${isPaid ? 'bg-emerald-950/10 hover:bg-emerald-950/20' : 'bg-amber-950/10 hover:bg-amber-950/20'}`}>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{idx + 1}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-yellow-400 font-bold">
                        {c.challan_number || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-3 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-xs">
                          {c.vehicle_number || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-emerald-400 font-bold">
                        Rs. {parseFloat(c.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{c.created_at || '—'}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{c.paid_at || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          isPaid
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {!isPaid && (
                          <button
                            onClick={() => handleMarkPaid(c.challan_number)}
                            disabled={markingId === c.challan_number}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white text-xs font-semibold rounded-lg transition-all"
                          >
                            {markingId === c.challan_number ? '...' : '✅ Mark Paid'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="text-5xl">🎫</div>
            <h3 className="text-xl font-bold text-white">No Challans Issued Yet</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Challans will appear here once generated from the Detection Dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Challans
