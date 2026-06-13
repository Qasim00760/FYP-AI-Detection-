import React, { useState } from 'react'

const BREADCRUMBS = {
  dashboard:      ['System', 'Dashboard'],
  live:           ['Monitoring', 'Live Camera'],
  'image-detect': ['Detection', 'Image Upload'],
  violations:     ['Records', 'Violations'],
  challans:       ['Records', 'Challans'],
  analytics:      ['Insights', 'Analytics'],
  settings:       ['System', 'Settings'],
}

export default function Topbar({ pageLabel, activePage }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const crumbs = BREADCRUMBS[activePage] || ['System', pageLabel]

  return (
    <header className="topbar">
      <div className="topbar-breadcrumb">
        <span className="breadcrumb-item">IBSCS</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-item">{crumbs[0]}</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{crumbs[1]}</span>
      </div>

      <div className="topbar-actions">
        {/* AI Status */}
        <div className="status-indicator">
          <div className="status-dot" />
          AI Engine Active
        </div>

        {/* Notifications */}
        <div
          className="topbar-btn"
          style={{ position: 'relative' }}
          onClick={() => setNotifOpen(p => !p)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <div className="badge-dot" />
          {notifOpen && (
            <div style={{
              position: 'absolute', top: '44px', right: 0,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)', padding: '8px', width: '300px',
              boxShadow: 'var(--shadow-lg)', zIndex: 200,
            }}>
              <div style={{ padding: '8px 12px', marginBottom: '4px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Notifications
              </div>
              {[
                { color: 'var(--danger)', text: 'Helmet violation detected — Plate: LHR-4892', time: '2 min ago' },
                { color: 'var(--warning)', text: 'OCR confidence below threshold (72%)', time: '8 min ago' },
                { color: 'var(--success)', text: 'Challan IBSCS-2025-000018 marked as paid', time: '1 hr ago' },
              ].map((n, i) => (
                <div key={i} style={{
                  padding: '10px 12px', borderRadius: 'var(--radius)',
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                  cursor: 'pointer', transition: 'var(--transition)',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.color, marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{n.text}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help */}
        <div className="topbar-btn" data-tooltip="Documentation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        {/* Avatar */}
        <div className="avatar" data-tooltip="Traffic Admin">TA</div>
      </div>
    </header>
  )
}
