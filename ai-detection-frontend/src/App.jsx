import React, { useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Dashboard from './pages/Dashboard.jsx'
<<<<<<< HEAD
import Violations from './pages/Violations.jsx'
import Challans from './pages/Challans.jsx'
import StatsPage from './pages/Stats.jsx'
=======
import LiveMonitoring from './pages/LiveMonitoring.jsx'
import ImageDetection from './pages/ImageDetection.jsx'
import Violations from './pages/Violations.jsx'
import Challans from './pages/Challans.jsx'
import Analytics from './pages/Analytics.jsx'
import Settings from './pages/Settings.jsx'

const PAGES = {
  dashboard:       { label: 'Dashboard',        component: Dashboard },
  live:            { label: 'Live Monitoring',   component: LiveMonitoring },
  'image-detect':  { label: 'Image Detection',   component: ImageDetection },
  violations:      { label: 'Violations',        component: Violations },
  challans:        { label: 'Challans',          component: Challans },
  analytics:       { label: 'Analytics',         component: Analytics },
  settings:        { label: 'Settings',          component: Settings },
}
>>>>>>> bdd88234b97f0cde792c0d0911070ff3ac8e3c07

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const PageComponent = PAGES[activePage]?.component || Dashboard
  const pageLabel     = PAGES[activePage]?.label     || 'Dashboard'

  return (
<<<<<<< HEAD
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
            <Route path="/violations" element={<Violations />} />
            <Route path="/challans" element={<Challans />} />
            <Route path="/stats" element={<StatsPage />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <Footer />
=======
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(p => !p)}
      />
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar pageLabel={pageLabel} activePage={activePage} />
        <div className="page-wrapper animate-fade" key={activePage}>
          <PageComponent onNavigate={setActivePage} />
        </div>
>>>>>>> bdd88234b97f0cde792c0d0911070ff3ac8e3c07
      </div>
    </div>
  )
}

export default App
