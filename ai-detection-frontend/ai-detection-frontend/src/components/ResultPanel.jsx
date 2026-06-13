import React, { useState } from 'react'

function ResultPanel({ fullResults, detections, annotatedImage, originalImage, backendUrl }) {
  const [challanStatus, setChallanStatus]   = useState(null)  // null | 'loading' | 'success' | 'error'
  const [challanNumber, setChallanNumber]   = useState('')
  const [challanError, setChallanError]     = useState('')
  const [editPlate, setEditPlate]           = useState(fullResults?.plate_text || '')
  const [fineAmount, setFineAmount]         = useState(1500)
  const [confirmed, setConfirmed]           = useState(false)

  const apiBase = backendUrl
    || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL)
    || 'https://qasimktk-ai-detection-backend.hf.space'

  const cleanUrl = apiBase.trim().replace(/\/+$/, '')

  // Safe base64 image src
  const getAnnotatedImgSrc = (imgStr) => {
    if (!imgStr) return ''
    if (imgStr.startsWith('data:image')) return imgStr
    return `data:image/jpeg;base64,${imgStr}`
  }

  // Confidence bar colors
  const getConfidenceColors = (conf) => {
    const score = conf * 100
    if (score > 80) return {
      bar:   'bg-emerald-500',
      text:  'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
      track: 'bg-emerald-950/40',
    }
    if (score >= 50) return {
      bar:   'bg-amber-500',
      text:  'text-amber-400 border-amber-500/20 bg-amber-500/10',
      track: 'bg-amber-950/40',
    }
    return {
      bar:   'bg-rose-500',
      text:  'text-rose-400 border-rose-500/20 bg-rose-500/10',
      track: 'bg-rose-950/40',
    }
  }

  const detectionCount = detections ? detections.length : 0

  // Challan eligibility
  const helmetViolation = fullResults?.helmet_violation === true
  const plateDetected   = fullResults?.plate_detected   === true
  const ocrConf         = fullResults?.ocr_confidence   || 0
  const isChallanEligible = helmetViolation && plateDetected && (ocrConf >= 0.70 || fullResults?.plate_text)

  const handleGenerateChallan = async () => {
    if (!confirmed) {
      setChallanError('Please check the confirmation box first.')
      return
    }
    setChallanStatus('loading')
    setChallanError('')
    try {
      // 1. Save violation
      await fetch(`${cleanUrl}/save-violation`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_number:    editPlate || 'UNKNOWN',
          helmet_status:     fullResults?.helmet_status     || 'Without Helmet',
          helmet_confidence: fullResults?.helmet_confidence || 0,
          ocr_confidence:    fullResults?.ocr_confidence    || 0,
          image_path:        '',
          source_type:       'image_upload',
        }),
      })

      // 2. Generate challan
      const res = await fetch(`${cleanUrl}/generate-challan`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_number: editPlate || 'UNKNOWN',
          amount:         fineAmount,
          evidence_path:  '',
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to generate challan')
      }

      const data = await res.json()
      setChallanNumber(data.challan_number)
      setChallanStatus('success')
    } catch (err) {
      setChallanError(err.message || 'Network error. Is backend running?')
      setChallanStatus('error')
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* ── Side-by-Side Images ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Original */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
          <div className="bg-slate-950/60 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-sm font-semibold tracking-wider uppercase text-slate-400">Original Upload</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300">Source</span>
          </div>
          <div className="p-4 flex-grow flex items-center justify-center bg-slate-950/30">
            {originalImage ? (
              <img src={originalImage} alt="Original"
                className="max-h-[400px] w-auto object-contain rounded-lg border border-slate-800/80 shadow-md" />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 italic">No image loaded</div>
            )}
          </div>
        </div>

        {/* Annotated */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col glow-blue">
          <div className="bg-slate-950/60 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-sm font-semibold tracking-wider uppercase text-blue-400">AI Detection Output</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">YOLOv8</span>
          </div>
          <div className="p-4 flex-grow flex items-center justify-center bg-slate-950/30">
            {annotatedImage ? (
              <img src={getAnnotatedImgSrc(annotatedImage)} alt="Annotated"
                className="max-h-[400px] w-auto object-contain rounded-lg border border-slate-850 shadow-md" />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 italic">No result generated</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Detection Status Card ── */}
      {fullResults && (fullResults.helmet_status || fullResults.plate_detected !== undefined) && (
        <div className={`rounded-xl border p-6 shadow-xl ${
          helmetViolation ? 'border-rose-500/60 bg-rose-950/10' : 'border-emerald-500/60 bg-emerald-950/10'
        }`}>
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            {helmetViolation ? '🔴 Violation Detected' : '🟢 No Violation'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">🪖 Helmet Status</div>
              <div className={`font-bold text-sm ${helmetViolation ? 'text-rose-400' : 'text-emerald-400'}`}>
                {fullResults.helmet_status || '—'}
              </div>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">📊 Helmet Conf.</div>
              <div className="font-bold text-white">
                {fullResults.helmet_confidence ? `${(fullResults.helmet_confidence * 100).toFixed(1)}%` : '—'}
              </div>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">🚗 Plate Number</div>
              <div className="font-mono font-bold text-blue-400 text-sm">
                {fullResults.plate_text || 'Not Detected'}
              </div>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">📖 OCR Conf.</div>
              <div className="font-bold text-white">
                {fullResults.ocr_confidence ? `${(fullResults.ocr_confidence * 100).toFixed(1)}%` : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detection Summary ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold font-display text-white">Detection Summary</h3>
            <p className="text-sm text-slate-400">All identified objects with confidence scores</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            detectionCount > 0
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              : 'bg-slate-800 text-slate-500'
          }`}>
            {detectionCount} {detectionCount === 1 ? 'object' : 'objects'}
          </span>
        </div>

        {detectionCount > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detections.map((det, index) => {
              const colors     = getConfidenceColors(det.confidence)
              const percentage = Math.round(det.confidence * 100)
              return (
                <div key={index}
                  className="bg-slate-950/40 border border-slate-800/60 hover:border-slate-700/80 transition-colors duration-200 rounded-lg p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100 capitalize font-display">
                      {det.class.replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${colors.text}`}>
                      {percentage}% Conf
                    </span>
                  </div>
                  <div className={`w-full ${colors.track} h-2 rounded-full overflow-hidden`}>
                    <div className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-950/20 border border-dashed border-slate-800 rounded-lg">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-slate-400 font-medium">No objects identified</p>
            <p className="text-xs text-slate-500 mt-1">Try a different image or check backend connection</p>
          </div>
        )}
      </div>

      {/* ── CHALLAN SECTION ── */}
      {challanStatus === 'success' ? (
        /* Success state */
        <div className="bg-emerald-950/30 border border-emerald-500 rounded-xl p-6 shadow-xl text-center space-y-3">
          <div className="text-4xl">✅</div>
          <h3 className="text-xl font-bold text-emerald-400">Challan Generated Successfully!</h3>
          <div className="inline-block px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <span className="text-xs text-emerald-500 uppercase tracking-wider block mb-1">Challan Number</span>
            <span className="font-mono font-bold text-emerald-300 text-lg">{challanNumber}</span>
          </div>
          <p className="text-sm text-slate-400">
            Violation and challan have been saved. View in Violations and Challans pages.
          </p>
        </div>
      ) : isChallanEligible ? (
        /* Eligible — show confirm form */
        <div className="bg-rose-950/20 border border-rose-500/60 rounded-xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-lg font-bold text-rose-400">Helmet Violation Detected!</h3>
              <p className="text-sm text-slate-400">Review details and confirm to generate challan.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Plate input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                ✏️ Verify / Edit Vehicle Number
              </label>
              <input
                type="text"
                value={editPlate}
                onChange={e => setEditPlate(e.target.value.toUpperCase())}
                placeholder="e.g. LEA1234"
                className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 rounded-lg px-3 py-2.5 text-white font-mono uppercase focus:outline-none text-sm"
              />
            </div>

            {/* Fine amount */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                💰 Fine Amount (Rs.)
              </label>
              <input
                type="number"
                value={fineAmount}
                onChange={e => setFineAmount(Number(e.target.value))}
                min={100}
                max={10000}
                step={100}
                className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 rounded-lg px-3 py-2.5 text-white focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-rose-500"
            />
            <span className="text-sm text-slate-300">
              I confirm this is a genuine violation. Vehicle{' '}
              <span className="font-mono text-rose-400">{editPlate || '—'}</span> was riding without a helmet.
              Challan of <span className="text-rose-400 font-bold">Rs. {fineAmount}</span> will be issued.
            </span>
          </label>

          {/* Error message */}
          {challanError && (
            <div className="bg-rose-950/40 border border-rose-500/30 rounded-lg p-3 text-rose-300 text-sm">
              ⚠️ {challanError}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerateChallan}
            disabled={challanStatus === 'loading'}
            className={`w-full py-3.5 rounded-xl font-bold font-display text-base flex items-center justify-center gap-2 transition-all duration-300 ${
              challanStatus === 'loading'
                ? 'bg-rose-600/40 text-slate-400 cursor-wait'
                : confirmed
                ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {challanStatus === 'loading' ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Challan...</span>
              </>
            ) : (
              <>
                <span>🎫</span>
                <span>Generate Challan</span>
              </>
            )}
          </button>
        </div>
      ) : fullResults && (
        /* Not eligible — show reason */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="text-xl">ℹ️</span>
            <div>
              <p className="text-sm font-semibold text-slate-300">Challan Not Applicable</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {!helmetViolation
                  ? 'No helmet violation detected in this image.'
                  : !plateDetected
                  ? 'Number plate not detected. Challan requires plate identification.'
                  : `OCR confidence too low (${(ocrConf * 100).toFixed(1)}%). Minimum 70% required.`}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default ResultPanel
