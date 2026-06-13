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
