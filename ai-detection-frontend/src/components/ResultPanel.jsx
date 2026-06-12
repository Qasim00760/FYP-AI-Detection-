import React from 'react'

function ResultPanel({ detections, annotatedImage, originalImage }) {
  // Safe extraction of base64 source
  const getAnnotatedImgSrc = (imgStr) => {
    if (!imgStr) return ''
    if (imgStr.startsWith('data:image')) return imgStr
    return `data:image/jpeg;base64,${imgStr}`
  }

  // Get color configurations based on confidence level
  const getConfidenceColors = (conf) => {
    const score = conf * 100
    if (score > 80) {
      return {
        bar: 'bg-emerald-500 glow-green',
        text: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
        track: 'bg-emerald-950/40',
      }
    } else if (score >= 50) {
      return {
        bar: 'bg-amber-500',
        text: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
        track: 'bg-amber-950/40',
      }
    } else {
      return {
        bar: 'bg-rose-500',
        text: 'text-rose-400 border-rose-500/20 bg-rose-500/10',
        track: 'bg-rose-950/40',
      }
    }
  }

  const detectionCount = detections ? detections.length : 0

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Side-by-Side Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Image */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
          <div className="bg-slate-950/60 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-sm font-semibold tracking-wider uppercase text-slate-400">Original Upload</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300">Source</span>
          </div>
          <div className="p-4 flex-grow flex items-center justify-center bg-slate-950/30">
            {originalImage ? (
              <img
                src={originalImage}
                alt="Original Upload"
                className="max-h-[400px] w-auto object-contain rounded-lg border border-slate-800/80 shadow-md"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 italic">No image loaded</div>
            )}
          </div>
        </div>

        {/* Annotated Result */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col glow-blue">
          <div className="bg-slate-950/60 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-sm font-semibold tracking-wider uppercase text-blue-400">AI Detection Output</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">YOLOv8</span>
          </div>
          <div className="p-4 flex-grow flex items-center justify-center bg-slate-950/30">
            {annotatedImage ? (
              <img
                src={getAnnotatedImgSrc(annotatedImage)}
                alt="Annotated Detection Result"
                className="max-h-[400px] w-auto object-contain rounded-lg border border-slate-850 shadow-md"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 italic">No result generated</div>
            )}
          </div>
        </div>
      </div>

      {/* Detection Results Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold font-display text-white">Detection Summary</h3>
            <p className="text-sm text-slate-400">Detailed list of model identifications and scores</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400">Total Detections:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              detectionCount > 0 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-800 text-slate-500'
            }`}>
              {detectionCount} {detectionCount === 1 ? 'object' : 'objects'}
            </span>
          </div>
        </div>

        {detectionCount > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detections.map((det, index) => {
              const colors = getConfidenceColors(det.confidence)
              const percentage = Math.round(det.confidence * 100)
              
              return (
                <div
                  key={index}
                  className="bg-slate-950/40 border border-slate-800/60 hover:border-slate-700/80 transition-colors duration-200 rounded-lg p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100 capitalize font-display">
                      {det.class.replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${colors.text}`}>
                      {percentage}% Conf
                    </span>
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div className="w-full">
                    <div className={`w-full ${colors.track} h-2 rounded-full overflow-hidden`}>
                      <div
                        className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-950/20 border border-dashed border-slate-800 rounded-lg">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-slate-400 font-medium">No objects identified</p>
            <p className="text-xs text-slate-500 mt-1">Try another model or a different image with clearer elements</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResultPanel
