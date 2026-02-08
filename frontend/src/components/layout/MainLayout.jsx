import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import SettingsSidebar from './SettingsSidebar'

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('dcoc-sidebar-collapsed')
    return saved === 'true'
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('dcoc-sidebar-collapsed', collapsed)
  }, [collapsed])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const sidebarWidth = isMobile ? (mobileOpen ? 240 : 0) : (collapsed ? 72 : 240)

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans selection:bg-primary-500/30 selection:text-white transition-colors duration-300 overflow-x-hidden">
      {/* Ambient Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Mobile Overlay Backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <SettingsSidebar
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className="transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) relative z-10 flex flex-col min-h-screen"
        style={{
          marginLeft: isMobile ? 0 : sidebarWidth,
          width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`
        }}
      >
        <Navbar
          onMenuClick={() => setMobileOpen(true)}
          onSettingsClick={() => setSettingsOpen(true)}
          isMobile={isMobile}
        />

        <main className="flex-1 p-4 lg:p-8 w-full max-w-[1600px] mx-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
