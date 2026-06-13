import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import ResultPanel from '../components/ResultPanel.jsx'

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
    import.meta.env.VITE_BACKEND_URL || 'https://qasimktk-ai-detection-backend.hf.space'
  )



  const [results, setResults] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Refs
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const frameProcessingRef = useRef(false)

  // Enumerate connected cameras
  const getCameraDevices = async () => {
    setError(null)
    try {
      // Request temporary permission to get labels
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true })
      tempStream.getTracks().forEach(track => track.stop())
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setCameras(videoDevices)
      
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId)
      }
    } catch (err) {
      console.error("Error enumerating cameras:", err)
      setError("Camera access permission denied or no cameras connected.")
    }
  }

  // Load cameras list on mode switch to camera
  useEffect(() => {
    if (inputMode === 'camera') {
      getCameraDevices()
    } else {
      stopCamera()
    }
  }, [inputMode])

  // Turn off camera when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Start Camera Stream
  const startCamera = async () => {
    setError(null)
    setResults(null)
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      const constraints = {
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsCameraActive(true)
    } catch (err) {
      console.error("Error starting camera:", err)
      setError("Failed to open camera stream. Make sure it is not in use by another app.")
    }
  }

  // Stop Camera Stream
  const stopCamera = () => {
    setIsLiveDetecting(false)
    setIsCameraActive(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setResults(null)
  }

  // Frame processing loop for Live Detection
  const processLiveFrame = async () => {
    if (!isLiveDetecting || !isCameraActive || frameProcessingRef.current) return

    if (!videoRef.current || !canvasRef.current) {
      requestAnimationFrame(processLiveFrame)
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      requestAnimationFrame(processLiveFrame)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(async (blob) => {
      if (!blob) {
        requestAnimationFrame(processLiveFrame)
        return
      }

      frameProcessingRef.current = true
      
      const cleanUrl = backendUrl.trim().replace(/\/+$/, '')
      // Live stream detects all four classes simultaneously via /detect_all
      const endpoint = `${cleanUrl}/detect_all`

      const formData = new FormData()
      formData.append('file', blob, 'frame.jpg')

      try {
        const response = await axios.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        if (response.data) {
          setResults(response.data)
        }
      } catch (err) {
        console.error("Live inference error:", err)
        // Show error but don't halt the video stream loop
      } finally {
        frameProcessingRef.current = false
        // Request next frame with minor delay to throttle request rate
        if (isLiveDetecting) {
          setTimeout(() => {
            requestAnimationFrame(processLiveFrame)
          }, 150) // Approx 6 FPS
        }
      }
    }, 'image/jpeg', 0.65) // Compress slightly to optimize payload size
  }

  // Start processing frames when detection is active
  useEffect(() => {
    if (isLiveDetecting && isCameraActive) {
      requestAnimationFrame(processLiveFrame)
    }
  }, [isLiveDetecting, isCameraActive])

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      validateAndSetFile(files[0])
    }
  }

  const handleFileChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      validateAndSetFile(files[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const validateAndSetFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload a JPG, JPEG, or PNG image.')
      setImageFile(null)
      setImagePreview(null)
      setResults(null)
      return
    }
    setError(null)
    setImageFile(file)
    setResults(null)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setResults(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDetection = async () => {
    if (!imageFile) return
    setLoading(true)
    setError(null)
    setResults(null)

    const cleanUrl = backendUrl.trim().replace(/\/+$/, '')
    const endpoint = `${cleanUrl}/${selectedModel}`

    const formData = new FormData()
    formData.append('file', imageFile)

    try {
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      if (response.data) {
        setResults(response.data)
      } else {
        throw new Error('Received empty response from the server.')
      }
    } catch (err) {
      console.error('API call failed:', err)
      const errorMsg = err.response?.data?.detail 
        || err.message 
        || 'Failed to connect to the AI backend. Please verify your Space/API URL and ensure the backend is running.'
      
      setError(
        `${errorMsg} (Target: ${endpoint}). Make sure CORS is enabled and the Hugging Face Space is active.`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-950 text-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-900">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white flex items-center gap-2">
              <span>🎯</span> Detection Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">Detect helmets, passengers, plates, and persons using real-time cameras or image uploads.</p>
          </div>

          {/* Configurable Endpoint URL */}
          <div className="w-full md:w-96 bg-slate-900 border border-slate-800 rounded-lg p-3">
            <label htmlFor="backend-url" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Backend Server URL
            </label>
            <div className="flex gap-2">
              <input
                id="backend-url"
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="e.g. http://localhost:8000"
                className="flex-grow bg-slate-950 border border-slate-800 focus:border-blue-500 rounded px-2 py-1 text-xs font-mono text-slate-350 focus:outline-none"
              />
              {backendUrl.includes('USERNAME') && (
                <span className="text-[10px] text-amber-500 self-center animate-pulse">⚠️ Replace USERNAME</span>
              )}
            </div>
          </div>
        </div>

        {/* Input Mode Selector */}
        <div className="flex justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex">
            <button
              onClick={() => { setInputMode('upload'); setResults(null); }}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 font-display flex items-center gap-2 ${
                inputMode === 'upload'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📂</span> File Upload
            </button>
            <button
              onClick={() => { setInputMode('camera'); setResults(null); }}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 font-display flex items-center gap-2 ${
                inputMode === 'camera'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📹</span> Live Camera
            </button>
          </div>
        </div>

        {/* Model Tabs Selection (Only visible in Upload Mode) */}
        {inputMode === 'upload' && (
          <div className="flex flex-wrap gap-2 sm:gap-4 justify-center animate-fadeIn">
            <button
              onClick={() => { setSelectedModel('helmet'); setResults(null); }}
              className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold font-display text-sm sm:text-base border transition-all duration-300 ${
                selectedModel === 'helmet'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-450 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <span>🪖</span>
              <span>Helmet Detection</span>
            </button>
            
            <button
              onClick={() => { setSelectedModel('plate'); setResults(null); }}
              className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold font-display text-sm sm:text-base border transition-all duration-300 ${
                selectedModel === 'plate'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-450 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <span>🚗</span>
              <span>Number Plate</span>
            </button>

            <button
              onClick={() => { setSelectedModel('person'); setResults(null); }}
              className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold font-display text-sm sm:text-base border transition-all duration-300 ${
                selectedModel === 'person'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-450 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <span>👤</span>
              <span>Person Detection</span>
            </button>
          </div>
        )}

        {/* Dashboard Panels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Panel: Controls (Conditional based on Input Mode) */}
          <div className="md:col-span-1 space-y-6">
            
            {/* FILE UPLOAD MODE */}
            {inputMode === 'upload' && (
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-6 shadow-xl space-y-4 animate-fadeIn">
                <h2 className="text-lg font-bold font-display text-white">Input Image</h2>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-500/5'
                      : imagePreview
                      ? 'border-slate-800 bg-slate-950/20'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="relative group overflow-hidden rounded-lg">
                      <img
                        src={imagePreview}
                        alt="Upload Preview"
                        className="max-h-48 mx-auto object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-lg">
                        <span className="text-xs font-semibold text-slate-200 bg-slate-900/80 px-2.5 py-1.5 rounded-md border border-slate-800">
                          Click or Drop to Replace
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-6">
                      <div className="text-4xl text-slate-500">📥</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">Drag & Drop Image Here</p>
                        <p className="text-xs text-slate-500 mt-1">or click to browse directories</p>
                      </div>
                      <p className="text-[10px] text-slate-500">Supports: JPG, JPEG, PNG</p>
                    </div>
                  )}
                </div>

                {imageFile && (
                  <div className="flex items-center justify-between text-xs bg-slate-950/60 border border-slate-850 rounded p-2.5 font-mono text-slate-400">
                    <span className="truncate max-w-[150px]">{imageFile.name}</span>
                    <button
                      onClick={clearImage}
                      className="text-rose-400 hover:text-rose-300 font-bold hover:scale-105 transition-transform"
                      title="Remove Image"
                    >
                      Clear [X]
                    </button>
                  </div>
                )}

                <button
                  onClick={handleDetection}
                  disabled={!imageFile || loading}
                  className={`w-full py-3.5 rounded-xl font-bold font-display flex items-center justify-center space-x-2 transition-all duration-300 shadow-md ${
                    !imageFile
                      ? 'bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed'
                      : loading
                      ? 'bg-blue-600/50 text-slate-300 border border-blue-500/20 cursor-wait'
                      : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/20 shadow-blue-500/10 hover:shadow-blue-500/20 hover:-translate-y-0.5'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing image...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>Detect Now</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* LIVE WEBCAM MODE */}
            {inputMode === 'camera' && (
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-6 shadow-xl space-y-5 animate-fadeIn">
                <h2 className="text-lg font-bold font-display text-white">Camera Controls</h2>
                
                {/* External/Internal Camera Device Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="camera-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Select Input Camera
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="camera-select"
                      value={selectedCamera}
                      onChange={(e) => {
                        setSelectedCamera(e.target.value)
                        if (isCameraActive) {
                          setTimeout(startCamera, 100)
                        }
                      }}
                      className="flex-grow bg-slate-950 border border-slate-800 focus:border-blue-500 rounded px-2.5 py-2 text-sm text-slate-200 focus:outline-none"
                    >
                      {cameras.length > 0 ? (
                        cameras.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${device.deviceId.substring(0, 5)}...`}
                          </option>
                        ))
                      ) : (
                        <option value="">No cameras loaded</option>
                      )}
                    </select>
                    
                    <button
                      onClick={getCameraDevices}
                      className="px-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded text-slate-350 hover:text-white transition-colors"
                      title="Reload connected cameras"
                    >
                      🔄
                    </button>
                  </div>
                </div>

                {/* Stream Actions */}
                <div className="space-y-3 pt-2">
                  {!isCameraActive ? (
                    <button
                      onClick={startCamera}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold font-display rounded-xl border border-blue-400/20 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all"
                    >
                      Open Camera
                    </button>
                  ) : (
                    <>
                      {/* Live Inference Toggle */}
                      {!isLiveDetecting ? (
                        <button
                          onClick={() => setIsLiveDetecting(true)}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-display rounded-xl border border-emerald-400/20 shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-2"
                        >
                          <span>⚡</span> Start Live Detection
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsLiveDetecting(false)}
                          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold font-display rounded-xl border border-amber-400/20 shadow-md shadow-amber-500/10 transition-all flex items-center justify-center gap-2"
                        >
                          <span>⏸️</span> Pause Detection
                        </button>
                      )}
                      
                      <button
                        onClick={stopCamera}
                        className="w-full py-3 bg-rose-700 hover:bg-rose-600 text-white font-semibold font-display rounded-xl border border-rose-500/20 transition-all"
                      >
                        Close Camera
                      </button>
                    </>
                  )}
                </div>

                {/* Helpful Tip */}
                <div className="text-[11px] text-slate-500 bg-slate-950/40 border border-slate-850 p-3 rounded-lg leading-relaxed">
                  💡 <strong>Multi-Model Pipeline active:</strong> Bypassing individual models to run Safety Helmet, License Plate, and Passenger detection simultaneously on your live stream.
                </div>
              </div>
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
                    detections={results.detections}
                    annotatedImage={results.annotated_image}
                    originalImage={imagePreview}
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
                    detections={results.detections}
                    annotatedImage={results.annotated_image}
                    originalImage={null} // Bypassed side-by-side inside result panel since they are drawn above
                  />
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard

