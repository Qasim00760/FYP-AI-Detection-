<<<<<<< HEAD
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
=======
import React, { useState } from 'react'

const VIOLATIONS = [
  { id: 'V-001', date: '2025-06-13 09:41:22', plate: 'LHR-4892', helmet: 'Without Helmet', helmetConf: 96.3, ocrConf: 89.1, source: 'Image', challan: 'IBSCS-2025-000094', status: 'pending' },
  { id: 'V-002', date: '2025-06-13 08:15:07', plate: 'ISB-2241', helmet: 'With Helmet',    helmetConf: 98.1, ocrConf: 93.4, source: 'Camera', challan: '—', status: 'cleared' },
  { id: 'V-003', date: '2025-06-12 17:32:44', plate: 'KHI-0317', helmet: 'Without Helmet', helmetConf: 87.7, ocrConf: 81.2, source: 'Camera', challan: 'IBSCS-2025-000089', status: 'paid' },
  { id: 'V-004', date: '2025-06-12 14:11:58', plate: 'RWP-7741', helmet: 'Without Helmet', helmetConf: 91.4, ocrConf: 77.6, source: 'Image',  challan: 'IBSCS-2025-000087', status: 'pending' },
  { id: 'V-005', date: '2025-06-12 11:05:30', plate: 'MUL-3389', helmet: 'With Helmet',    helmetConf: 94.2, ocrConf: 88.9, source: 'Camera', challan: '—', status: 'cleared' },
  { id: 'V-006', date: '2025-06-11 16:22:13', plate: 'FSD-9012', helmet: 'Without Helmet', helmetConf: 88.6, ocrConf: 83.1, source: 'Camera', challan: 'IBSCS-2025-000081', status: 'paid' },
  { id: 'V-007', date: '2025-06-11 13:47:02', plate: 'LHR-1133', helmet: 'Without Helmet', helmetConf: 93.7, ocrConf: 86.5, source: 'Image',  challan: 'IBSCS-2025-000079', status: 'pending' },
  { id: 'V-008', date: '2025-06-10 10:08:55', plate: 'KHI-4421', helmet: 'With Helmet',    helmetConf: 97.3, ocrConf: 91.0, source: 'Camera', challan: '—', status: 'cleared' },
  { id: 'V-009', date: '2025-06-10 08:55:41', plate: 'ISB-0098', helmet: 'Without Helmet', helmetConf: 85.4, ocrConf: 76.3, source: 'Camera', challan: 'IBSCS-2025-000073', status: 'paid' },
  { id: 'V-010', date: '2025-06-09 15:30:19', plate: 'RWP-5500', helmet: 'Without Helmet', helmetConf: 92.1, ocrConf: 84.7, source: 'Image',  challan: 'IBSCS-2025-000067', status: 'pending' },
  { id: 'V-011', date: '2025-06-09 12:14:36', plate: 'LHR-7723', helmet: 'Without Helmet', helmetConf: 89.9, ocrConf: 80.2, source: 'Camera', challan: 'IBSCS-2025-000062', status: 'paid' },
  { id: 'V-012', date: '2025-06-08 09:02:47', plate: 'GUJ-2266', helmet: 'Without Helmet', helmetConf: 94.8, ocrConf: 87.4, source: 'Camera', challan: 'IBSCS-2025-000055', status: 'pending' },
]

const STATUS_CFG = {
  pending: { label: 'Pending',  color: 'warning' },
  paid:    { label: 'Paid',     color: 'success' },
  cleared: { label: 'Cleared', color: 'muted' },
}

export default function Violations({ onNavigate }) {
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all')
  const [srcFilt, setSrcFilt] = useState('all')
  const [preview, setPreview] = useState(null)
  const [page,    setPage]    = useState(1)
  const PER_PAGE = 8

  const filtered = VIOLATIONS.filter(v => {
    const q = search.toLowerCase()
    const matchQ = !q || v.plate.toLowerCase().includes(q) || v.id.toLowerCase().includes(q) || v.challan.toLowerCase().includes(q)
    const matchF = filter  === 'all' || v.status  === filter
    const matchS = srcFilt === 'all' || v.source.toLowerCase() === srcFilt
    return matchQ && matchF && matchS
  })

  const pages   = Math.ceil(filtered.length / PER_PAGE)
  const display = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)

  const downloadCSV = () => {
    const header = 'ID,Date,Plate,Helmet Status,Helmet Conf,OCR Conf,Source,Challan,Status\n'
    const rows   = VIOLATIONS.map(v =>
      [v.id,v.date,v.plate,v.helmet,v.helmetConf,v.ocrConf,v.source,v.challan,v.status].join(',')
    ).join('\n')
    const blob   = new Blob([header+rows], { type: 'text/csv' })
    const url    = URL.createObjectURL(blob)
    const a      = document.createElement('a'); a.href = url; a.download = 'violations.csv'; a.click()
  }

  return (
    <div className="stagger">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Violations Management</h1>
          <p className="page-subtitle">{VIOLATIONS.length} records — helmet violation detection log</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={downloadCSV}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('image-detect')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            New Detection
          </button>
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: VIOLATIONS.length, color: 'primary' },
          { label: 'Violations', value: VIOLATIONS.filter(v => v.helmet === 'Without Helmet').length, color: 'danger' },
          { label: 'Challans Pending', value: VIOLATIONS.filter(v => v.status === 'pending').length, color: 'warning' },
          { label: 'Paid', value: VIOLATIONS.filter(v => v.status === 'paid').length, color: 'success' },
          { label: 'Cleared (No Violation)', value: VIOLATIONS.filter(v => v.status === 'cleared').length, color: 'muted' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '9px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)',
            border: '1px solid var(--border-subtle)', display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <span className={`badge ${s.color}`}>{s.value}</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="input-search" style={{ flex: 1, minWidth: 240 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="Search by plate, ID, or challan number..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="input" value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} style={{ width: 'auto' }}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="cleared">Cleared</option>
        </select>
        <select className="input" value={srcFilt} onChange={e => { setSrcFilt(e.target.value); setPage(1) }} style={{ width: 'auto' }}>
          <option value="all">All Sources</option>
          <option value="image">Image Upload</option>
          <option value="camera">Live Camera</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, marginBottom: 16 }}>
        <div className="data-table-wrapper" style={{ borderRadius: 'var(--radius-md)', border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date / Time</th>
                <th>Number Plate</th>
                <th>Helmet Status</th>
                <th>Helmet Conf.</th>
                <th>OCR Conf.</th>
                <th>Source</th>
                <th>Challan No.</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {display.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '48px 0' }}>
                    <div className="empty-state">
                      <div className="empty-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                      </div>
                      <div className="empty-title">No records found</div>
                      <div className="empty-desc">Try adjusting your search or filters</div>
                    </div>
                  </td>
                </tr>
              ) : display.map(v => (
                <tr key={v.id} onClick={() => setPreview(v)}>
                  <td><span className="mono">{v.id}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>{v.date}</td>
                  <td>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: 'var(--info)' }}>
                      {v.plate}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${v.helmet === 'Without Helmet' ? 'danger' : 'success'}`}>
                      {v.helmet === 'Without Helmet' ? '✗ ' : '✓ '}{v.helmet}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--border-subtle)', borderRadius: 9999, minWidth: 60 }}>
                        <div style={{ height: '100%', borderRadius: 9999, width: `${v.helmetConf}%`,
                          background: v.helmetConf >= 90 ? 'var(--success)' : v.helmetConf >= 80 ? 'var(--warning)' : 'var(--danger)' }} />
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 600, width: 42 }}>{v.helmetConf}%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--border-subtle)', borderRadius: 9999, minWidth: 60 }}>
                        <div style={{ height: '100%', borderRadius: 9999, width: `${v.ocrConf}%`,
                          background: v.ocrConf >= 85 ? 'var(--success)' : v.ocrConf >= 75 ? 'var(--warning)' : 'var(--danger)' }} />
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 600, width: 42 }}>{v.ocrConf}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${v.source === 'Camera' ? 'primary' : 'purple'}`}>{v.source}</span>
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: v.challan !== '—' ? 'var(--text-secondary)' : 'var(--text-disabled)' }}>
                    {v.challan}
                  </td>
                  <td><span className={`badge ${STATUS_CFG[v.status].color}`}>{STATUS_CFG[v.status].label}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => setPreview(v)} data-tooltip="View Evidence">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      {v.challan !== '—' && (
                        <button className="btn btn-ghost btn-xs" data-tooltip="Print Challan">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        </button>
                      )}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length} records
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</button>
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} className={`btn btn-sm ${page === i+1 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(i+1)}>{i+1}</button>
            ))}
            <button className="btn btn-secondary btn-sm" disabled={page === pages} onClick={() => setPage(p => p+1)}>Next →</button>
          </div>
        </div>
      )}

      {/* Evidence Preview Modal */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
          onClick={() => setPreview(null)}>
          <div className="card animate-scale" style={{ width: 520, maxWidth: '92vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Violation Detail — {preview.id}</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setPreview(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Simulated evidence image */}
            <div style={{ background: '#000', borderRadius: 'var(--radius)', marginBottom: 20, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Evidence Image: data/evidence/{preview.plate}_{preview.date.replace(/[: ]/g,'-')}.jpg</div>
              <div style={{ position: 'absolute', top: 10, right: 10 }}>
                <span className="ai-badge">AI Annotated</span>
              </div>
            </div>

            {[
              ['Violation ID',   preview.id],
              ['Date & Time',    preview.date],
              ['Number Plate',   preview.plate],
              ['Helmet Status',  preview.helmet],
              ['Helmet Conf.',   `${preview.helmetConf}%`],
              ['OCR Confidence', `${preview.ocrConf}%`],
              ['Detection Source', preview.source],
              ['Challan Number', preview.challan],
              ['Status',        preview.status.charAt(0).toUpperCase() + preview.status.slice(1)],
            ].map(([l,v], i) => (
              <div key={i} className="stat-row">
                <div className="stat-label">{l}</div>
                <div className="stat-value" style={l === 'Number Plate' ? { fontFamily: 'JetBrains Mono, monospace', color: 'var(--info)' } : {}}>{v}</div>
              </div>
            ))}
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setPreview(null)}>Close</button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Print Challan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
>>>>>>> f3caa57e29f13368a7c50a430faf8cc8daf9cf2d
