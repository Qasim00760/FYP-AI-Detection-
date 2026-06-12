import React from 'react'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-8 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        {/* Tech Badges / Text */}
        <div className="flex flex-col items-center md:items-start space-y-1">
          <p className="font-medium text-slate-200">
            Multi-Model AI Detection System
          </p>
          <p className="text-xs text-slate-500">
            Built with <span className="text-blue-400">React + Vite</span> &bull; <span className="text-emerald-400">FastAPI</span> &bull; <span className="text-indigo-400">YOLOv8</span>
          </p>
        </div>

        {/* Links */}
        <div className="flex space-x-6">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 hover:text-white transition-colors duration-200"
          >
            <span>GitHub</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
          <a
            href="https://huggingface.co"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 hover:text-white transition-colors duration-200"
          >
            <span>Hugging Face</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-slate-500">
          &copy; {currentYear} AI Detection. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer
