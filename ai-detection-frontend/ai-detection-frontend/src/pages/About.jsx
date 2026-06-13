import React from 'react'

function About() {
  const team = [
    {
      name: 'Ammad Ali',
      role: 'AI & Backend Engineer',
      image: '👨‍💻',
      desc: 'Specializes in YOLOv8 model training, FastAPI backend development, and computer vision pipelines.',
    },
    {
      name: 'Meherban Ali',
      role: 'Full Stack Developer',
      image: '👨‍🔬',
      desc: 'Responsible for React frontend architecture, API integration, and live camera streaming features.',
    },
    {
      name: 'Fiza Nawaz',
      role: 'Project Lead & Documentation',
      image: '👩‍💼',
      desc: 'Leads project coordination, system documentation, and final year project presentation preparation.',
    },
  ]

  return (
    <div className="bg-slate-950 text-white min-h-screen py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Header Section */}
        <div className="max-w-3xl space-y-4">
          <span className="text-sm font-semibold tracking-wider uppercase text-blue-400">
            About the Project
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display text-white">
            Final Year Project: Multi-Model AI Detection
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            This project was developed as a comprehensive solution to showcase state-of-the-art computer vision models served in real-time. By bridging a modern, lightweight reactive user interface with an optimized FastAPI microservice, we deliver rapid and accurate inference on safety compliance, transportation, and crowd management models.
          </p>
        </div>

        {/* Tech Stack Section */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-8 sm:p-12 shadow-xl space-y-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">Technical Architecture Stack</h2>
            <p className="text-slate-400 mt-1">A look at the modern developer tools driving this project</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            {/* Frontend badging */}
            <div className="space-y-4 bg-slate-950/40 p-6 rounded-xl border border-slate-800">
              <h3 className="text-lg font-semibold text-blue-400 font-display flex items-center space-x-2">
                <span>💻</span> <span>Frontend Layer</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">React</span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Vite</span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">Tailwind CSS</span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">GitHub Pages</span>
              </div>
              <p className="text-xs text-slate-500">
                Single Page Application bundle optimized for delivery, containing client-side image loading, routing, and canvas visualization.
              </p>
            </div>

            {/* Backend badging */}
            <div className="space-y-4 bg-slate-950/40 p-6 rounded-xl border border-slate-800">
              <h3 className="text-lg font-semibold text-emerald-400 font-display flex items-center space-x-2">
                <span>⚡</span> <span>Backend REST API</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">FastAPI</span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Python</span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">Hugging Face Spaces</span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Docker</span>
              </div>
              <p className="text-xs text-slate-500">
                High-performance ASGI server configured with custom CORS policies, drawing OpenCV annotations, and handling multi-model initialization.
              </p>
            </div>

            {/* AI models badging */}
            <div className="space-y-4 bg-slate-950/40 p-6 rounded-xl border border-slate-800">
              <h3 className="text-lg font-semibold text-violet-400 font-display flex items-center space-x-2">
                <span>🧠</span> <span>AI & Detection Models</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">YOLOv8</span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">Ultralytics</span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">OpenCV</span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">PyTorch</span>
              </div>
              <p className="text-xs text-slate-500">
                Ultralytics object detection models running inference. Annotated bounding boxes are rendered directly on raw numpy buffers and outputted as base64.
              </p>
            </div>
          </div>
        </div>


        {/* Team Section */}
        <div className="space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold font-display text-white">Project Development Team</h2>
            <p className="text-slate-400">
              The engineers and researchers who built and trained the object detection models.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-850 hover:border-slate-750 rounded-xl p-6 text-center space-y-4 hover:shadow-lg transition-all duration-300">
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-4xl shadow-inner">
                  {member.image}
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-white">{member.name}</h3>
                  <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">{member.role}</span>
                </div>
                <p className="text-slate-450 text-sm">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
