import React from 'react'

function HowItWorks() {
  const steps = [
    {
      step: '01',
      icon: '📤',
      title: 'Upload Image',
      description: 'Select any image from your device. The system supports JPG, JPEG, and PNG formats, and loads a preview instantly.',
    },
    {
      step: '02',
      icon: '🤖',
      title: 'Select Model',
      description: 'Choose between Helmet Detection, Number Plate recognition, or Person Detection depending on your compliance or tracking goal.',
    },
    {
      step: '03',
      icon: '⚡',
      title: 'API Processing',
      description: 'The frontend packs the image into a FormData envelope and dispatches a POST request to our FastAPI backend hosted on Hugging Face.',
    },
    {
      step: '04',
      icon: '🎯',
      title: 'YOLOv8 Detection',
      description: 'The backend parses raw bytes, converts it for OpenCV buffer analysis, runs YOLOv8 model inference, and annotates targets in milliseconds.',
    },
    {
      step: '05',
      icon: '📊',
      title: 'Display Results',
      description: 'The annotated JPEG is returned as a base64 string and drawn alongside original inputs. Interactive metrics showcase object counts and confidence.',
    },
  ]

  return (
    <div className="bg-slate-950 text-white min-h-screen py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Title and Intro */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-sm font-semibold tracking-wider uppercase text-blue-400">Pipeline Pipeline</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display">How the AI System Works</h1>
          <p className="text-slate-400">
            A step-by-step breakdown of how data travels from your browser to our custom deep learning endpoints.
          </p>
        </div>

        {/* Steps Cards Timeline */}
        <div className="relative">
          {/* Connector Line (visible on desktop) */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 hidden lg:block z-0"></div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10">
            {steps.map((item, idx) => (
              <div
                key={idx}
                className="group bg-slate-900 border border-slate-850 hover:border-blue-500/40 rounded-2xl p-6 shadow-xl space-y-6 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden"
              >
                {/* Accent top bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 group-hover:from-blue-500 group-hover:to-indigo-500 transition-all duration-300"></div>

                {/* Step badge and icon */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-950/60 rounded text-slate-500 border border-slate-850 group-hover:text-blue-400 group-hover:border-blue-500/20 transition-colors">
                    Step {item.step}
                  </span>
                  <span className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-display text-white group-hover:text-blue-300 transition-colors duration-200">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Connected Workflow Summary */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-8 sm:p-12 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold font-display">Client-Server Connection Flow</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                When you click <strong>Detect Now</strong>, the system opens a network pipeline. The image data is packaged as an HTTP multipart upload form, avoiding large payloads inside URL strings.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                On receiving the frame, FastAPI leverages Pillow and NumPy to translate binary streams into multi-dimensional image arrays compatible with PyTorch and OpenCV. Once inference concludes, the annotated output is written back to a memory buffer and serialized as a Base64 payload, minimizing disk storage operations on the server side.
              </p>
              <div className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-400 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800">
                <span>⚡ Network Overhead: &lt; 50ms</span>
              </div>
            </div>
            
            {/* Visual Workflow box */}
            <div className="bg-slate-950 rounded-xl border border-slate-850 p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono pb-2 border-b border-slate-850">
                <span>Method / Endpoints</span>
                <span>Type</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded border border-slate-850">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25">POST</span>
                    <span className="font-mono text-xs text-slate-350">/helmet</span>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">safety evaluation</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded border border-slate-850">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25">POST</span>
                    <span className="font-mono text-xs text-slate-350">/plate</span>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">license parser</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded border border-slate-850">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25">POST</span>
                    <span className="font-mono text-xs text-slate-350">/person</span>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">crowd counter</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 text-center pt-2">
                Server response format: JSON containing bounding box objects + Base64 JPEGs.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HowItWorks
