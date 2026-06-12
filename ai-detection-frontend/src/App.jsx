import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import HowItWorks from './pages/HowItWorks.jsx'
import Dashboard from './pages/Dashboard.jsx'

function App() {
  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
        {/* Navigation Bar */}
        <Navbar />
        
        {/* Main Content Area */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </HashRouter>
  )
}

export default App
