import React, { useEffect, useRef, useState } from 'react'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

<<<<<<< HEAD
function Dashboard() {
  const [selectedModel, setSelectedModel] = useState('helmet') // helmet, plate, person
  const [inputMode, setInputMode] = useState('upload') // 'upload' or 'camera'
  
  // Image Upload States
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  
  // Camera States
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState('')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isLiveDetecting, setIsLiveDetecting] = useState(false)
  
  // App States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // NOTE: Replace with your deployed Hugging Face backend Space URL
  // Example: https://<YOUR_HF_USERNAME>-ai-detection-backend.hf.space
  const [backendUrl, setBackendUrl] = useState(
    import.meta.env.VITE_BACKEND_URL || 'https://Qasim00760-ai-detection-backend.hf.space'
  )



  const [results, setResults] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Refs
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const frameProcessingRef = useRef(false)
=======
/* ── tiny helpers ── */
const MetricIcon = ({ type, children }) => (
  <div className={`metric-icon ${type}`}>{children}</div>
)
>>>>>>> bdd88234b97f0cde792c0d0911070ff3ac8e3c07

const TrendUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
)
const TrendDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

/* ── Violation Trend Chart ── */
function ViolationChart() {
  const ref = useRef(null)
  useEffect(() => {
    const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const violations = [24, 31, 28, 45, 52, 38, 61, 74, 58, 83, 91, 76]
    const challans   = [18, 22, 19, 34, 41, 29, 48, 60, 44, 67, 74, 59]
    const chart = new Chart(ref.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Violations',
            data: violations,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239,68,68,0.08)',
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: '#EF4444',
            pointBorderColor: '#0F172A',
            pointBorderWidth: 2,
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Challans Issued',
            data: challans,
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37,99,235,0.08)',
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: '#2563EB',
            pointBorderColor: '#0F172A',
            pointBorderWidth: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#94A3B8',
              font: { family: 'Inter', size: 12 },
              padding: 20,
              usePointStyle: true,
              pointStyleWidth: 8,
            },
          },
          tooltip: {
            backgroundColor: '#1E293B',
            borderColor: '#243044',
            borderWidth: 1,
            titleColor: '#F1F5F9',
            bodyColor: '#94A3B8',
            padding: 12,
            cornerRadius: 10,
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(36,48,68,0.6)', drawBorder: false },
            ticks: { color: '#64748B', font: { family: 'Inter', size: 11.5 } },
          },
          y: {
            grid: { color: 'rgba(36,48,68,0.6)', drawBorder: false },
            ticks: { color: '#64748B', font: { family: 'Inter', size: 11.5 } },
            beginAtZero: true,
          },
        },
      },
    })
    return () => chart.destroy()
  }, [])
  return <canvas ref={ref} />
}

/* ── Helmet Compliance Donut ── */
function ComplianceChart() {
  const ref = useRef(null)
  useEffect(() => {
    const chart = new Chart(ref.current, {
      type: 'doughnut',
      data: {
        labels: ['With Helmet', 'Violation'],
        datasets: [{
          data: [73, 27],
          backgroundColor: ['rgba(34,197,94,0.85)', 'rgba(239,68,68,0.85)'],
          borderColor: ['#22C55E', '#EF4444'],
          borderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94A3B8',
              font: { family: 'Inter', size: 12 },
              padding: 16,
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: '#1E293B',
            borderColor: '#243044',
            borderWidth: 1,
            titleColor: '#F1F5F9',
            bodyColor: '#94A3B8',
            padding: 12,
            cornerRadius: 10,
            callbacks: { label: ctx => ` ${ctx.parsed}%` },
          },
        },
      },
    })
    return () => chart.destroy()
  }, [])
  return <canvas ref={ref} />
}

/* ── Hourly Activity Bar Chart ── */
function HourlyChart() {
  const ref = useRef(null)
  useEffect(() => {
    const hours = ['6am','7am','8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm']
    const data  = [2,5,11,18,9,7,6,8,10,14,17,21,12,8,4]
    const chart = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels: hours,
        datasets: [{
          label: 'Detections',
          data,
          backgroundColor: data.map(v =>
            v >= 15 ? 'rgba(239,68,68,0.75)' : v >= 10 ? 'rgba(245,158,11,0.75)' : 'rgba(37,99,235,0.6)'
          ),
          borderColor: data.map(v =>
            v >= 15 ? '#EF4444' : v >= 10 ? '#F59E0B' : '#2563EB'
          ),
          borderWidth: 1,
          borderRadius: 5,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1E293B',
            borderColor: '#243044',
            borderWidth: 1,
            titleColor: '#F1F5F9',
            bodyColor: '#94A3B8',
            padding: 10,
            cornerRadius: 8,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748B', font: { family: 'Inter', size: 10.5 } },
          },
          y: {
            grid: { color: 'rgba(36,48,68,0.6)', drawBorder: false },
            ticks: { color: '#64748B', font: { family: 'Inter', size: 11 } },
            beginAtZero: true,
          },
        },
      },
    })
    return () => chart.destroy()
  }, [])
  return <canvas ref={ref} />
}

/* ── MAIN COMPONENT ── */
export default function Dashboard({ onNavigate }) {
  const metrics = [
    { label: 'Total Violations',   value: '1,284', sub: 'Since deployment',     type: 'danger',  trend: '+14%', up: true,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    },
    { label: 'Total Challans',     value: '947',   sub: 'Successfully issued',   type: 'primary', trend: '+9%',  up: true,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
    },
    { label: 'Paid Challans',      value: '621',   sub: 'PKR 18.6M collected',   type: 'success', trend: '+22%', up: true,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    },
    { label: 'Pending Challans',   value: '326',   sub: 'Awaiting payment',      type: 'warning', trend: '-5%',  up: false,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    },
    { label: 'Unique Vehicles',    value: '834',   sub: 'Distinct number plates', type: 'info',   trend: '+7%',  up: true,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
    },
    { label: 'AI Accuracy Rate',   value: '94.2%', sub: 'Avg detection confidence', type: 'purple', trend: '+1.3%', up: true,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/><circle cx="12" cy="12" r="3"/></svg>
    },
  ]

  const recentActivity = [
    { type: 'danger',  title: 'Violation Detected',   desc: 'Motorcycle without helmet — Plate: LHR-4892 | Conf: 96.3%', time: '2 min ago' },
    { type: 'primary', title: 'Challan Issued',        desc: 'IBSCS-2025-000094 issued for PKR 1,500 | LHR-4892',        time: '3 min ago' },
    { type: 'success', title: 'Payment Received',      desc: 'Challan IBSCS-2025-000082 paid — PKR 1,500',               time: '18 min ago' },
    { type: 'warning', title: 'Low OCR Confidence',    desc: 'Plate OCR returned 68% — below threshold (75%)',           time: '35 min ago' },
    { type: 'info',    title: 'Camera Feed Restored',  desc: 'Camera C-01 reconnected after 4-minute outage',            time: '51 min ago' },
    { type: 'primary', title: 'Challan Issued',        desc: 'IBSCS-2025-000093 issued for PKR 1,500 | ISB-2241',        time: '1 hr ago' },
  ]

  const ACTIVITY_ICONS = {
    danger:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>,
    primary: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>,
    success: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    warning: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    info:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  }

  const aiStats = [
    { label: 'Helmet Model (YOLOv8)', value: '94.2%', bar: 94, color: 'primary' },
    { label: 'Plate Detection Model', value: '96.7%', bar: 97, color: 'success' },
    { label: 'OCR Accuracy (EasyOCR)', value: '89.1%', bar: 89, color: 'info' },
    { label: 'False Positive Rate',   value: '5.8%',  bar: 6,  color: 'danger' },
  ]

  return (
    <div className="stagger">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 className="page-title">Command Dashboard</h1>
            <span className="ai-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
              AI Powered
            </span>
          </div>
          <p className="page-subtitle">Real-time overview of the Integrated Bike Safety and Challan System</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => onNavigate('analytics')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Analytics
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('live')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14"/><rect x="3" y="8" width="12" height="8" rx="2"/></svg>
            Live Feed
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        {metrics.map((m, i) => (
          <div key={i} className={`metric-card ${m.type}`}>
            <div className="metric-header">
              <MetricIcon type={m.type}>{m.icon}</MetricIcon>
              <div className={`metric-trend ${m.up ? 'up' : 'down'}`}>
                {m.up ? <TrendUp /> : <TrendDown />}
                {m.trend}
              </div>
            </div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Trend Chart + Compliance */}
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Violation & Challan Trend</div>
              <div className="card-subtitle">Monthly comparison — current year</div>
            </div>
            <span className="badge muted">2025</span>
          </div>
          <div className="chart-container tall">
            <ViolationChart />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Helmet Compliance</div>
              <div className="card-subtitle">Overall detection rate</div>
            </div>
          </div>
          <div className="chart-container" style={{ height: 200 }}>
            <ComplianceChart />
          </div>
          <div className="divider" />
          <div>
            {[
              { label: 'Compliance Rate', value: '73%', color: 'var(--success)' },
              { label: 'Violation Rate',  value: '27%', color: 'var(--danger)' },
              { label: 'Avg Confidence',  value: '94.2%', color: 'var(--primary)' },
            ].map((s, i) => (
              <div key={i} className="stat-row">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Hourly + Activity + AI Stats */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        {/* Hourly */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Hourly Detections</div>
              <div className="card-subtitle">Today's activity heatmap</div>
            </div>
          </div>
          <div className="chart-container" style={{ height: 200 }}>
            <HourlyChart />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            {[['Peak Hour','8:00 AM','var(--danger)'],['Detections Today','152','var(--primary)'],['Avg/Hour','10.2','var(--text-secondary)']].map(([l,v,c], i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: c, letterSpacing: '-0.02em' }}>{v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Activity</div>
            <button className="btn btn-ghost btn-xs">View All</button>
          </div>
          <div className="timeline">
            {recentActivity.map((a, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-line">
                  <div className={`timeline-dot ${a.type}`}>{ACTIVITY_ICONS[a.type]}</div>
                  <div className="timeline-connector" />
                </div>
                <div className="timeline-content">
                  <div className="timeline-title">{a.title}</div>
                  <div className="timeline-desc">{a.desc}</div>
                  <div className="timeline-time">{a.time}</div>
                </div>
              </div>
<<<<<<< HEAD
            )}
          </div>

          {/* Right Panel: Live Feed / Annotated Outputs (Conditional) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Error alerts */}
            {error && (
              <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 flex items-start space-x-3 text-rose-300 shadow-lg">
                <span className="text-xl">⚠️</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">System Alert</h4>
                  <p className="text-xs leading-relaxed text-rose-450">{error}</p>
                </div>
              </div>
            )}

            {/* STATIC UPLOAD RESULTS */}
            {inputMode === 'upload' && (
              <>
                {!results && !loading && (
                  <div className="bg-slate-900 border border-slate-850 rounded-xl p-8 text-center space-y-4 shadow-xl">
                    <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center text-3xl mx-auto shadow-inner">
                      🤖
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h3 className="text-lg font-bold font-display text-white">Awaiting Detection Task</h3>
                      <p className="text-sm text-slate-400">
                        Select an optimized YOLOv8 model category above, upload a source file, and click <strong>Detect Now</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="bg-slate-900 border border-slate-850 rounded-xl p-16 text-center space-y-6 shadow-xl flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-slate-950 border-t-blue-500 animate-spin"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg">🤖</div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold font-display text-white animate-pulse">Running Neural Inference...</h3>
                      <p className="text-xs text-slate-450 max-w-xs mx-auto">
                        Sending binary frames to the server. Loading YOLO weights. Overlaying bounding annotations.
                      </p>
                    </div>
                  </div>
                )}

                {results && !loading && (
                  <ResultPanel
                    fullResults={results}
                    detections={results.detections}
                    annotatedImage={results.annotated_image}
                    originalImage={imagePreview}
                    backendUrl={backendUrl}
                  />
                )}
              </>
            )}

            {/* LIVE CAMERA MODE VIEWPORT */}
            {inputMode === 'camera' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Camera Live Stream */}
                  <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-xl flex flex-col">
                    <div className="bg-slate-950/60 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-sm font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${isCameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></span>
                        Raw Camera Stream
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-350">Live</span>
                    </div>
                    <div className="p-4 flex-grow flex items-center justify-center bg-slate-950/30 min-h-[300px]">
                      {isCameraActive ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="max-h-[350px] w-full object-contain rounded-lg border border-slate-800/80 shadow-md transform -scale-x-100"
                        />
                      ) : (
                        <div className="text-center space-y-2 text-slate-500 italic">
                          <span className="text-4xl block mb-1">📹</span>
                          <span>Camera is closed</span>
                          <p className="text-xs text-slate-600 not-italic">Click "Open Camera" to start streaming</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Live Output */}
                  <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-xl flex flex-col glow-blue">
                    <div className="bg-slate-950/60 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-sm font-semibold tracking-wider uppercase text-blue-400 flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${isLiveDetecting ? 'bg-blue-500 animate-ping' : 'bg-slate-700'}`}></span>
                        AI Live Output
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">YOLOv8 Pipeline</span>
                    </div>
                    <div className="p-4 flex-grow flex items-center justify-center bg-slate-950/30 min-h-[300px]">
                      {results && results.annotated_image ? (
                        <img
                          src={`data:image/jpeg;base64,${results.annotated_image}`}
                          alt="AI Live Output Feed"
                          className="max-h-[350px] w-full object-contain rounded-lg border border-slate-850 shadow-md transform -scale-x-100"
                        />
                      ) : (
                        <div className="text-center space-y-2 text-slate-500 italic">
                          <span className="text-4xl block mb-1">🧠</span>
                          {isLiveDetecting ? (
                            <span className="animate-pulse">Processing live frames...</span>
                          ) : (
                            <span>Live detection is paused</span>
                          )}
                          <p className="text-xs text-slate-600 not-italic">Click "Start Live Detection" to begin neural pipeline overlay</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Hidden canvas for video framing */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Detections lists */}
                {results && (
                  <ResultPanel
                    fullResults={results}
                    detections={results.detections}
                    annotatedImage={results.annotated_image}
                    originalImage={null}
                    backendUrl={backendUrl}
                  />
                )}
              </div>
            )}

=======
            ))}
>>>>>>> bdd88234b97f0cde792c0d0911070ff3ac8e3c07
          </div>
        </div>

        {/* AI Detection Stats */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">AI Model Performance</div>
              <div className="card-subtitle">Live inference statistics</div>
            </div>
            <span className="ai-badge">Live</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            {aiStats.map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${s.color}`} style={{ width: `${s.bar}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
            {[
              { label: 'Avg Inference', value: '38ms',    icon: '⚡' },
              { label: 'Model Uptime',  value: '99.8%',   icon: '🟢' },
              { label: 'Queue Length',  value: '0 jobs',  icon: '📋' },
              { label: 'GPU Usage',     value: 'N/A (CPU)', icon: '🖥️' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-muted)', borderRadius: 'var(--radius)', padding: '10px 12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
