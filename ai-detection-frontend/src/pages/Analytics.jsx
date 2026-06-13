import React from 'react'

export default function Analytics({ onNavigate }) {
  return (
    <div className="stagger">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Analytics & Insights</h1>
          <p className="page-subtitle">Deep dive into traffic enforcement data and trends</p>
        </div>
      </div>
      
      <div className="empty-state card">
        <div className="empty-icon" style={{ background: 'var(--primary-soft)', borderColor: 'rgba(37,99,235,0.25)' }}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <div className="empty-title" style={{ fontSize: 18 }}>Analytics Engine Initializing</div>
        <div className="empty-desc" style={{ maxWidth: 400 }}>
          The advanced analytics module is aggregating historical data to generate predictive insights, heatmap generation, and compliance trend modeling.
        </div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onNavigate('dashboard')}>
          Return to Dashboard
        </button>
      </div>
    </div>
  )
}
