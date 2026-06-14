import React, { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

/* ── mini detection timeline chart ── */
function LiveTimelineChart({ data }) {
  const ref = useRef(null)
  const chartRef = useRef(null)
  useEffect(() => {
    if (chartRef.current) chartRef.current.destroy()
    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels: data.map((_,i) => `${i}s`),
        datasets: [{
          data: data,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37,99,235,0.15)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false, min: 0, max: 100 },
        },
        animation: false,
      },
    })
    return () => chartRef.current?.destroy()
  }, [data])
  return <canvas ref={ref} />
}

/* ── Simulated camera frame renderer ── */
function CameraFrame({ detections, isRunning, frameCount }) {
  const bikes  = detections.bikes  || []
  const plates = detections.plates || []

  return (
    <div className="camera-feed" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1426 50%, #0a1020 100%)' }}>
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Scanning line when running */}
      {isRunning && (
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.8), transparent)',
          animation: 'scanLine 2s linear infinite',
          zIndex: 5,
        }} />
      )}

      {/* Corner markers */}
      {['tl','tr','bl','br'].map(c => (
        <div key={c} className={`camera-corner ${c}`} />
      ))}

      {/* Simulated bike shape */}
      <div style={{
        position: 'absolute',
        bottom: '25%', left: '50%',
        transform: 'translateX(-50%)',
        width: 180, height: 100,
        opacity: 0.12,
      }}>
        <svg viewBox="0 0 180 100" fill="white">
          <ellipse cx="40" cy="80" rx="30" ry="8" />
          <ellipse cx="140" cy="80" rx="30" ry="8" />
          <path d="M40 80 Q60 30 90 25 Q120 20 140 80" stroke="white" strokeWidth="4" fill="none"/>
          <circle cx="90" cy="15" r="12" fill="white" opacity="0.6"/>
        </svg>
      </div>

      {/* Detection boxes */}
      {bikes.map((b, i) => (
        <div key={i} className="detection-box" style={{
          left: b.x, top: b.y, width: b.w, height: b.h,
          borderColor: b.helmet ? '#22C55E' : '#EF4444',
          boxShadow: `0 0 12px ${b.helmet ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
        }}>
          <div style={{
            position: 'absolute', top: -24, left: -1,
            background: b.helmet ? '#22C55E' : '#EF4444',
            color: 'white', fontSize: 10.5, fontWeight: 700,
            padding: '2px 7px', borderRadius: '3px 3px 0 0',
            whiteSpace: 'nowrap',
          }}>
            {b.helmet ? '✓ HELMET' : '✗ NO HELMET'} {(b.conf * 100).toFixed(1)}%
          </div>
        </div>
      ))}
      {plates.map((p, i) => (
        <div key={i} className="detection-box" style={{
          left: p.x, top: p.y, width: p.w, height: p.h,
          borderColor: '#06B6D4',
          boxShadow: '0 0 10px rgba(6,182,212,0.4)',
        }}>
          <div style={{
            position: 'absolute', bottom: -22, left: -1,
            background: '#06B6D4', color: '#0F172A',
            fontSize: 10, fontWeight: 800, padding: '2px 7px',
            borderRadius: '0 0 3px 3px', whiteSpace: 'nowrap',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {p.text}
          </div>
        </div>
      ))}

      {/* Camera HUD */}
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8 }}>
        {isRunning
          ? <span className="live-badge"><span className="live-dot" /> REC</span>
          : <span className="badge muted">PAUSED</span>
        }
        <span style={{
          background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 'var(--radius)', padding: '3px 9px',
          fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace',
        }}>
          CAM-01 | 1080p | {frameCount} fps
        </span>
      </div>

      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <span style={{
          background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 'var(--radius)', padding: '3px 9px',
          fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace',
        }}>
          {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Bottom bar */}
      <div className="camera-status-bar">
        <div style={{ display: 'flex', gap: 14 }}>
          {bikes[0] && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              <span style={{ color: bikes[0].helmet ? '#22C55E' : '#EF4444', fontWeight: 700 }}>
                {bikes[0].helmet ? '✓ Helmet Detected' : '⚠ No Helmet'}
              </span>
            </div>
          )}
          {plates[0] && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              Plate: <span style={{ color: '#06B6D4', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{plates[0].text}</span>
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>IBSCS v2.1 | AI Engine</div>
      </div>
    </div>
  )
}

/* ── MOCK DETECTIONS ── */
const MOCK_STATES = [
  {
    helmet: false, plate: 'LHR-4892', helmetConf: 0.963,
    ocrConf: 0.891, procTime: 41, eligible: true,
    bikes:  [{ x:'30%', y:'25%', w:'40%', h:'55%', helmet: false, conf: 0.963 }],
    plates: [{ x:'42%', y:'62%', w:'18%', h:'12%', text:'LHR-4892' }],
  },
  {
    helmet: true, plate: 'ISB-2241', helmetConf: 0.981,
    ocrConf: 0.934, procTime: 38, eligible: false,
    bikes:  [{ x:'28%', y:'22%', w:'44%', h:'58%', helmet: true, conf: 0.981 }],
    plates: [{ x:'40%', y:'64%', w:'20%', h:'13%', text:'ISB-2241' }],
  },
  {
    helmet: false, plate: 'KHI-0317', helmetConf: 0.877,
    ocrConf: 0.812, procTime: 45, eligible: true,
    bikes:  [{ x:'25%', y:'20%', w:'50%', h:'60%', helmet: false, conf: 0.877 }],
    plates: [{ x:'38%', y:'63%', w:'22%', h:'14%', text:'KHI-0317' }],
  },
]

export default function LiveMonitoring({ onNavigate }) {
  const [isRunning,   setIsRunning]   = useState(false)
  const [stateIdx,    setStateIdx]    = useState(0)
  const [frameCount,  setFrameCount]  = useState(0)
  const [chartData,   setChartData]   = useState(Array(60).fill(0))
  const [showChallan, setShowChallan] = useState(false)
  const [challaned,   setChallaned]   = useState(false)
  const [timeline,    setTimeline]    = useState([])
  const intervalRef = useRef(null)

  const cur = MOCK_STATES[stateIdx]

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setFrameCount(f => f + 1)
        setStateIdx(i => (i + 1) % MOCK_STATES.length)
        setChartData(prev => {
          const newConf = Math.round(70 + Math.random() * 30)
          return [...prev.slice(1), newConf]
        })
        setTimeline(prev => {
          const state = MOCK_STATES[Math.floor(Math.random() * MOCK_STATES.length)]
          const entry = {
            type: state.helmet ? 'success' : 'danger',
            text: state.helmet
              ? `Helmet detected — ${state.plate} (${(state.helmetConf*100).toFixed(1)}%)`
              : `VIOLATION — No helmet — ${state.plate}`,
            time: new Date().toLocaleTimeString(),
          }
          return [entry, ...prev].slice(0, 12)
        })
      }, 1800)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  const handleChallan = () => {
    setChallaned(true)
    setShowChallan(false)
    setTimeline(prev => [{
      type: 'primary',
      text: `Challan issued — ${cur.plate} | IBSCS-2025-${String(Math.floor(Math.random()*99+1)).padStart(6,'0')}`,
      time: new Date().toLocaleTimeString(),
    }, ...prev])
  }

  return (
    <div className="stagger">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Live Monitoring</h1>
          <p className="page-subtitle">Real-time AI-assisted helmet violation detection via camera feed</p>
        </div>
        <div className="page-actions">
          <button
            className={`btn ${isRunning ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => { setIsRunning(p => !p); setChallaned(false); setShowChallan(false) }}
          >
            {isRunning ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Stop</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start Camera</>
            )}
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Left: Camera + Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <CameraFrame detections={{ bikes: isRunning ? cur.bikes : [], plates: isRunning ? cur.plates : [] }} isRunning={isRunning} frameCount={isRunning ? '25–30' : '--'} />
          </div>

          {/* Confidence Trend */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Real-time Confidence Signal</div>
              <span className="badge info">60-second window</span>
            </div>
            <div className="chart-container short">
              <LiveTimelineChart data={chartData} />
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Detection Timeline</div>
              <span className="badge muted">{timeline.length} events</span>
            </div>
            {timeline.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px' }}>
                <div className="empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                <div className="empty-title">No events yet</div>
                <div className="empty-desc">Start the camera feed to begin live detection</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {timeline.map((t, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px',
                    borderRadius: 'var(--radius)', background: i === 0 ? 'rgba(37,99,235,0.05)' : 'transparent',
                    border: i === 0 ? '1px solid rgba(37,99,235,0.12)' : '1px solid transparent',
                    transition: 'var(--transition)',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: t.type === 'danger' ? 'var(--danger)' : t.type === 'success' ? 'var(--success)' : 'var(--primary)' }} />
                    <div style={{ flex: 1, fontSize: 12.5, color: 'var(--text-primary)' }}>{t.text}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{t.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Detection Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Helmet Status */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Detection Status</div>
            {isRunning ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center',
                  background: cur.helmet ? 'var(--success-soft)' : 'var(--danger-soft)',
                  border: `2px solid ${cur.helmet ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{cur.helmet ? '✅' : '🚨'}</div>
                  <div style={{
                    fontSize: 15, fontWeight: 800,
                    color: cur.helmet ? 'var(--success)' : 'var(--danger)',
                    letterSpacing: '-0.01em',
                  }}>
                    {cur.helmet ? 'HELMET DETECTED' : 'VIOLATION DETECTED'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {cur.helmet ? 'Rider is compliant' : 'Rider without helmet'}
                  </div>
                </div>

                {[
                  { label: 'Helmet Confidence', value: `${(cur.helmetConf*100).toFixed(1)}%`,
                    bar: cur.helmetConf*100, color: cur.helmet ? 'success' : 'danger' },
                  { label: 'OCR Confidence',    value: `${(cur.ocrConf*100).toFixed(1)}%`,
                    bar: cur.ocrConf*100, color: 'info' },
                ].map((s,i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{s.label}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</span>
                    </div>
                    <div className="progress-bar">
                      <div className={`progress-fill ${s.color}`} style={{ width: `${s.bar}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '24px', gap: 8 }}>
                <div style={{ fontSize: 28 }}>📷</div>
                <div className="empty-desc">Start camera to view live detection results</div>
              </div>
            )}
          </div>

          {/* Plate Info */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 14 }}>Number Plate</div>
            {isRunning ? (
              <div>
                <div style={{
                  background: 'var(--bg-muted)', border: '2px solid var(--info)',
                  borderRadius: 'var(--radius)', padding: '14px 20px',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 22,
                  fontWeight: 800, color: 'var(--info)', textAlign: 'center',
                  letterSpacing: '0.12em', marginBottom: 14,
                  boxShadow: '0 0 20px var(--info-glow)',
                }}>
                  {cur.plate}
                </div>
                <div className="stat-row"><div className="stat-label">OCR Engine</div><div className="stat-value">EasyOCR</div></div>
                <div className="stat-row"><div className="stat-label">Confidence</div><div className="stat-value" style={{ color: 'var(--info)' }}>{(cur.ocrConf*100).toFixed(1)}%</div></div>
                <div className="stat-row"><div className="stat-label">Process Time</div><div className="stat-value">{cur.procTime}ms</div></div>
              </div>
            ) : (
              <div style={{ padding: '12px 0', color: 'var(--text-disabled)', fontSize: 13, textAlign: 'center' }}>
                Awaiting feed...
              </div>
            )}
          </div>

          {/* Challan Action */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 14 }}>Enforcement Action</div>
            {challaned ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--success)' }}>Challan Issued Successfully</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Recorded in system</div>
              </div>
            ) : isRunning && cur.eligible ? (
              <>
                <div style={{
                  padding: '10px 14px', background: 'var(--warning-soft)',
                  border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius)',
                  fontSize: 12.5, color: 'var(--warning)', marginBottom: 14,
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
                  Operator review required before challan issuance
                </div>
                <button className="btn btn-danger w-full" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowChallan(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Generate Challan
                </button>
              </>
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                {!isRunning ? 'Start camera first' : 'No eligible violation detected'}
              </div>
            )}
          </div>

          {/* Confirm Modal (inline) */}
          {showChallan && (
            <div className="card" style={{ border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.04)' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--danger)', marginBottom: 12 }}>⚠ Confirm Challan Issuance</div>
              <div className="stat-row"><div className="stat-label">Plate</div><div className="stat-value mono">{cur.plate}</div></div>
              <div className="stat-row"><div className="stat-label">Offense</div><div className="stat-value" style={{ color: 'var(--danger)' }}>No Helmet</div></div>
              <div className="stat-row"><div className="stat-label">Fine</div><div className="stat-value">PKR 1,500</div></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowChallan(false)}>Cancel</button>
                <button className="btn btn-danger"    style={{ flex: 1, justifyContent: 'center' }} onClick={handleChallan}>Confirm</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
