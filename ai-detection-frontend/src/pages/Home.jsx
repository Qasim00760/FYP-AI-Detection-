import React from 'react'
import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="bg-slate-950 text-white min-h-screen flex flex-col justify-between overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pulse-glow-bg pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pulse-glow-bg pointer-events-none" style={{ animationDelay: '-4s' }}></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-blue-400 tracking-wider uppercase mb-2 shadow-inner">
            <span>⚡ YOLOv8 AI Model Suite</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-display tracking-tight text-white leading-tight">
            AI-Powered <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-indigo-500 bg-clip-text text-transparent">
              Detection System
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-400 font-normal leading-relaxed">
            Detect helmets, number plates, and persons using advanced, state-of-the-art YOLOv8 models. Streamline compliance, security, and object tracking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/35 hover:-translate-y-0.5 text-center font-display border border-blue-400/20"
            >
              Get Started
            </Link>
            <Link
              to="/how-it-works"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-all duration-300 hover:-translate-y-0.5 text-center"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
              Complete Detection Suite
            </h2>
            <p className="text-slate-400">
              Three specialized models loaded and optimized for millisecond response times.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Helmet Detection */}
            <div className="group bg-slate-900/40 border border-slate-850 hover:border-blue-500/40 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:bg-slate-900/80 shadow-lg relative overflow-hidden flex flex-col justify-between h-full">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-300"></div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  🪖
                </div>
                <h3 className="text-xl font-bold font-display text-white mb-3 group-hover:text-blue-400 transition-colors duration-200">
                  Helmet Detection
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Detect whether workers are wearing safety helmets in real-time. Crucial for industrial safety and regulatory compliance monitoring.
                </p>
              </div>
              <Link to="/dashboard" className="text-sm font-semibold text-blue-400 group-hover:text-blue-300 inline-flex items-center space-x-1.5 hover:underline">
                <span>Try Helmet Model</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* Card 2: Plate Recognition */}
            <div className="group bg-slate-900/40 border border-slate-850 hover:border-indigo-500/40 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:bg-slate-900/80 shadow-lg relative overflow-hidden flex flex-col justify-between h-full">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-300"></div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  🚗
                </div>
                <h3 className="text-xl font-bold font-display text-white mb-3 group-hover:text-indigo-400 transition-colors duration-200">
                  Number Plate Recognition
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Extract and read vehicle license plates automatically. Ideal for automated parking management, traffic monitoring, and security gating.
                </p>
              </div>
              <Link to="/dashboard" className="text-sm font-semibold text-indigo-400 group-hover:text-indigo-300 inline-flex items-center space-x-1.5 hover:underline">
                <span>Try Plate Model</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* Card 3: Person Detection */}
            <div className="group bg-slate-900/40 border border-slate-850 hover:border-emerald-500/40 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:bg-slate-900/80 shadow-lg relative overflow-hidden flex flex-col justify-between h-full">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-300"></div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  👤
                </div>
                <h3 className="text-xl font-bold font-display text-white mb-3 group-hover:text-emerald-400 transition-colors duration-200">
                  Person Detection
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Detect and count people in any complex environment. Useful for surveillance, retail analytics, crowd control, and pedestrian monitoring.
                </p>
              </div>
              <Link to="/dashboard" className="text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 inline-flex items-center space-x-1.5 hover:underline">
                <span>Try Person Model</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-900 border-t border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {/* Stat 1 */}
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold text-blue-500 font-display">3</div>
              <div className="text-sm font-semibold text-slate-350 tracking-wider uppercase">Active AI Models</div>
              <p className="text-xs text-slate-500">Helmet, plate, and person models loaded simultaneously</p>
            </div>
            {/* Stat 2 */}
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold text-indigo-500 font-display">Real-Time</div>
              <div className="text-sm font-semibold text-slate-350 tracking-wider uppercase">Detection Speeds</div>
              <p className="text-xs text-slate-500">Inference executed in milliseconds on GPU instances</p>
            </div>
            {/* Stat 3 */}
            <div className="space-y-2">
              <div className="text-4xl sm:text-5xl font-extrabold text-emerald-500 font-display">YOLOv8</div>
              <div className="text-sm font-semibold text-slate-350 tracking-wider uppercase">Powered Backend</div>
              <p className="text-xs text-slate-500">Equipped with state-of-the-art CNN object detectors</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
