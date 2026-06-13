<<<<<<< HEAD
import React, { useState, useEffect } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://Qasim00760-ai-detection-backend.hf.space'

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
=======
import React, { useState } from 'react'

const CHALLANS = [
  { id: 'IBSCS-2025-000094', plate: 'LHR-4892', amount: 1500, status: 'pending', created: '2025-06-13 09:43:15', paid: '',         violation: 'V-001' },
  { id: 'IBSCS-2025-000093', plate: 'ISB-2241', amount: 1500, status: 'paid',    created: '2025-06-13 08:17:44', paid: '2025-06-13 11:20:03', violation: 'V-002' },
  { id: 'IBSCS-2025-000089', plate: 'KHI-0317', amount: 1500, status: 'paid',    created: '2025-06-12 17:35:12', paid: '2025-06-13 09:05:51', violation: 'V-003' },
  { id: 'IBSCS-2025-000087', plate: 'RWP-7741', amount: 1500, status: 'pending', created: '2025-06-12 14:14:08', paid: '',         violation: 'V-004' },
  { id: 'IBSCS-2025-000081', plate: 'FSD-9012', amount: 1500, status: 'paid',    created: '2025-06-11 16:24:47', paid: '2025-06-12 08:41:22', violation: 'V-006' },
  { id: 'IBSCS-2025-000079', plate: 'LHR-1133', amount: 1500, status: 'pending', created: '2025-06-11 13:49:30', paid: '',         violation: 'V-007' },
  { id: 'IBSCS-2025-000073', plate: 'ISB-0098', amount: 1500, status: 'paid',    created: '2025-06-10 08:58:02', paid: '2025-06-10 16:30:09', violation: 'V-009' },
  { id: 'IBSCS-2025-000067', plate: 'RWP-5500', amount: 1500, status: 'pending', created: '2025-06-09 15:32:44', paid: '',         violation: 'V-010' },
  { id: 'IBSCS-2025-000062', plate: 'LHR-7723', amount: 1500, status: 'paid',    created: '2025-06-09 12:16:55', paid: '2025-06-09 17:22:41', violation: 'V-011' },
  { id: 'IBSCS-2025-000055', plate: 'GUJ-2266', amount: 1500, status: 'pending', created: '2025-06-08 09:05:11', paid: '',         violation: 'V-012' },
]

const PRINT_TEMPLATE = (c) => `
INTEGRATED BIKE SAFETY AND CHALLAN SYSTEM (IBSCS)
Traffic Enforcement Authority — Punjab Province
================================================================

TRAFFIC VIOLATION NOTICE

Challan Number : ${c.id}
Issue Date     : ${c.created}
Status         : ${c.status.toUpperCase()}

VEHICLE INFORMATION
  Number Plate : ${c.plate}
  Offense      : Riding a motorcycle without helmet
  Section      : Motor Vehicle Ordinance, Section 74-B

FINE DETAILS
  Fine Amount  : PKR ${c.amount.toLocaleString()}
  Payment Due  : Within 30 days of issuance

PAYMENT INSTRUCTIONS
  Pay online at: pay.ibscs.gov.pk
  Challan Ref  : ${c.id}

This notice is system-generated. For disputes, contact:
  Traffic Warden Office, Lahore | +92-42-99200001

================================================================
IBSCS v2.1 | Powered by AI Computer Vision
`

export default function Challans({ onNavigate }) {
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all')
  const [selected,setSelected]= useState(null)
  const [data,    setData]    = useState(CHALLANS)
  const [page,    setPage]    = useState(1)
  const PER_PAGE = 7

  const filtered = data.filter(c => {
    const q = search.toLowerCase()
    const matchQ = !q || c.id.toLowerCase().includes(q) || c.plate.toLowerCase().includes(q)
    const matchF = filter === 'all' || c.status === filter
    return matchQ && matchF
  })

  const pages   = Math.ceil(filtered.length / PER_PAGE)
  const display = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)

  const markPaid = (id) => {
    setData(prev => prev.map(c => c.id === id
      ? { ...c, status: 'paid', paid: new Date().toISOString().replace('T',' ').slice(0,19) }
      : c
    ))
    setSelected(prev => prev ? { ...prev, status: 'paid', paid: new Date().toISOString().replace('T',' ').slice(0,19) } : null)
  }

  const printChallan = (c) => {
    const w = window.open('', '_blank')
    w.document.write(`<pre style="font-family:monospace;padding:32px;background:#fff;color:#000;font-size:13px">${PRINT_TEMPLATE(c)}</pre>`)
    w.print()
  }

  const paid    = data.filter(c => c.status === 'paid').length
  const pending = data.filter(c => c.status === 'pending').length
  const total   = data.reduce((s, c) => s + c.amount, 0)
  const collected = data.filter(c=>c.status==='paid').reduce((s,c)=>s+c.amount,0)

  return (
    <div className="stagger">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Challan Management</h1>
          <p className="page-subtitle">Track, verify, and manage all issued traffic challans</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('image-detect')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Issue New Challan
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Challans',   value: data.length,               type: 'primary', pre: '' },
          { label: 'Pending Payment',  value: pending,                   type: 'warning', pre: '' },
          { label: 'Paid Challans',    value: paid,                      type: 'success', pre: '' },
          { label: 'Total Collected',  value: `PKR ${collected.toLocaleString()}`, type: 'info', pre: '' },
        ].map((m, i) => (
          <div key={i} className={`metric-card ${m.type}`}>
            <div className="metric-value" style={{ fontSize: 24 }}>{m.value}</div>
            <div className="metric-label">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div className="input-search" style={{ flex: 1 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="Search by challan number or plate..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        {['all','pending','paid'].map(f => (
          <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setFilter(f); setPage(1) }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={`badge ${f === 'all' ? 'muted' : f === 'pending' ? 'warning' : 'success'}`} style={{ marginLeft: 4 }}>
              {f === 'all' ? data.length : data.filter(c => c.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, marginBottom: 16 }}>
        <div className="data-table-wrapper" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Challan No.</th>
                <th>Vehicle Plate</th>
                <th>Fine Amount</th>
                <th>Status</th>
                <th>Issued At</th>
                <th>Paid At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {display.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>No challans found</td></tr>
              ) : display.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)}>
                  <td><span className="mono" style={{ color: 'var(--primary)' }}>{c.id}</span></td>
                  <td>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: 'var(--info)', fontSize: 13 }}>
                      {c.plate}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>PKR {c.amount.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${c.status === 'paid' ? 'success' : 'warning'}`}>
                      {c.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{c.created}</td>
                  <td style={{ fontSize: 12.5, color: c.paid ? 'var(--success)' : 'var(--text-disabled)' }}>{c.paid || '—'}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => setSelected(c)}>View</button>
                      {c.status === 'pending' && (
                        <button className="btn btn-success btn-xs" onClick={() => markPaid(c.id)}>Mark Paid</button>
                      )}
                      <button className="btn btn-ghost btn-xs" onClick={() => printChallan(c)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
            {Array.from({length: pages},(_,i) => (
              <button key={i} className={`btn btn-sm ${page===i+1 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(i+1)}>{i+1}</button>
            ))}
            <button className="btn btn-secondary btn-sm" disabled={page===pages} onClick={() => setPage(p=>p+1)}>Next →</button>
          </div>
        </div>
      )}

      {/* Challan Detail Modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)' }}
          onClick={() => setSelected(null)}>
          <div className="card animate-scale" style={{ width: 500, maxWidth:'92vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Challan Details</div>
                <div style={{ fontSize: 12, color:'var(--text-muted)', marginTop: 2, fontFamily:'JetBrains Mono,monospace' }}>{selected.id}</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <span className={`badge ${selected.status === 'paid' ? 'success' : 'warning'}`}>
                  {selected.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                </span>
                <button className="btn btn-ghost btn-icon" onClick={() => setSelected(null)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            <div style={{ background:'var(--bg-muted)', borderRadius:'var(--radius)', padding:'16px', marginBottom: 20 }}>
              {[
                ['Challan Number',   selected.id],
                ['Vehicle Plate',    selected.plate],
                ['Offense',          'Riding without helmet'],
                ['Fine Amount',      `PKR ${selected.amount.toLocaleString()}`],
                ['Date Issued',      selected.created],
                ['Payment Date',     selected.paid || 'Not yet paid'],
                ['Linked Violation', selected.violation],
              ].map(([l,v], i) => (
                <div key={i} className="stat-row">
                  <div className="stat-label">{l}</div>
                  <div className="stat-value" style={l === 'Vehicle Plate' ? {fontFamily:'JetBrains Mono,monospace', color:'var(--info)'} : l === 'Fine Amount' ? {color:'var(--warning)'} : {}}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-secondary" style={{flex:1, justifyContent:'center'}} onClick={() => setSelected(null)}>Close</button>
              {selected.status === 'pending' && (
                <button className="btn btn-success" style={{flex:1, justifyContent:'center'}} onClick={() => markPaid(selected.id)}>
                  Mark as Paid
                </button>
              )}
              <button className="btn btn-primary" style={{flex:1, justifyContent:'center'}} onClick={() => printChallan(selected)}>
                Print Challan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
>>>>>>> bdd88234b97f0cde792c0d0911070ff3ac8e3c07
