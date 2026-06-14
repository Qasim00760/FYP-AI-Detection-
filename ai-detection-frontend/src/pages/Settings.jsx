import React from 'react'

export default function Settings({ onNavigate }) {
  return (
    <div className="stagger">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">Configure AI detection thresholds, camera parameters, and enforcement rules</p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>AI Inference Engine</div>
          
          <div className="input-group" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="input-label">Helmet Detection Threshold</label>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>70%</span>
            </div>
            <input type="range" className="range-input" min="50" max="95" defaultValue="70" />
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Minimum confidence score to flag a helmet violation</div>
          </div>

          <div className="input-group" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="input-label">OCR Recognition Threshold</label>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--info)' }}>75%</span>
            </div>
            <input type="range" className="range-input" min="50" max="95" defaultValue="75" />
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Minimum confidence score to accept a number plate reading</div>
          </div>

          <div className="divider" />
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>False Detection Override (FDO)</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Use comparative logic to reduce false positives</div>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <div className="toggle-slider"></div>
            </label>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>Enforcement Parameters</div>
          
          <div className="input-group" style={{ marginBottom: 16 }}>
            <label className="input-label">Base Fine Amount (PKR)</label>
            <input className="input" type="number" defaultValue={1500} />
          </div>

          <div className="input-group" style={{ marginBottom: 16 }}>
            <label className="input-label">Duplicate Violation Window (Minutes)</label>
            <input className="input" type="number" defaultValue={15} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Grace period before the same vehicle is fined again</div>
          </div>

          <div className="divider" />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>Auto-Generate Challans</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bypass operator review if confidence is &gt; 95%</div>
            </div>
            <label className="toggle">
              <input type="checkbox" />
              <div className="toggle-slider"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
