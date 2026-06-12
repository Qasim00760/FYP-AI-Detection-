import React, { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  // Common NavLink style callback
  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
      isActive
        ? 'text-blue-400 bg-slate-800/60 shadow-inner border border-slate-700/50'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
    }`

  const mobileNavLinkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-base font-medium transition-all duration-300 ${
      isActive
        ? 'text-blue-400 bg-slate-800 border-l-4 border-blue-500 pl-4'
        : 'text-slate-300 hover:text-white hover:bg-slate-800'
    }`

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand Name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🤖</span>
              <span className="text-xl font-bold font-display tracking-tight text-white bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                AI Detection
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink to="/" className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/about" className={navLinkClass}>
                About
              </NavLink>
              <NavLink to="/how-it-works" className={navLinkClass}>
                How It Works
              </NavLink>
              <NavLink to="/dashboard" className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 border border-blue-400/20">
                Dashboard
              </NavLink>
            </div>
          </div>

          {/* Mobile hamburger menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${isOpen ? 'block animate-fadeIn' : 'hidden'} md:hidden`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-900 border-b border-slate-800">
          <NavLink to="/" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
            Home
          </NavLink>
          <NavLink to="/about" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
            About
          </NavLink>
          <NavLink to="/how-it-works" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
            How It Works
          </NavLink>
          <NavLink to="/dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-500 text-center font-display shadow-md">
            Dashboard
          </NavLink>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
