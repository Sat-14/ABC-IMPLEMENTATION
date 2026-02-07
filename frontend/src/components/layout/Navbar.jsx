import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { Bell, Settings, Menu, X, Clock, Activity, Shield, ArrowRight } from 'lucide-react'
import { getAuditLogs } from '../../api/audit'
import { formatDate } from '../../utils/formatters'
import SearchDropdown from './SearchDropdown'

export default function Navbar({ onMenuClick, onSettingsClick, isMobile }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  const fetchLogs = async () => {
    try {
      const res = await getAuditLogs({ per_page: 5 })
      setRecentLogs(res.data.logs || [])
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 60000) // Poll every 60s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-40 h-20 px-8 flex items-center justify-between glass border-b border-border-subtle backdrop-blur-md transition-colors duration-300">
      {/* Search Area */}
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <SearchDropdown />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4">

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-full transition-all duration-200 ${showNotifications ? 'bg-primary-50 text-primary-600' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <span className="text-sm font-bold text-[#0F172A]">Recent Activity</span>
                <Shield className="w-4 h-4 text-primary-500" />
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log, idx) => (
                    <div key={log.log_id} className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0`}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
                          <Activity className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider mb-0.5">
                            {log.action.replace(/_/g, ' ')}
                          </p>
                          <p className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed">
                            {log.details}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-[11px] text-slate-400 font-medium">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No recent activity</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => { setShowNotifications(false); navigate('/audit'); }}
                className="w-full p-3 bg-slate-50 text-xs font-bold text-primary-600 hover:bg-blue-50 hover:text-blue-700 transition-all border-t border-slate-100 flex items-center justify-center gap-1.5"
              >
                View full audit trail <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={onSettingsClick}
          className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-border-subtle mx-2"></div>

        {/* Date/Time or Status (Optional) */}
        <div className="hidden md:block text-right">
          <p className="text-xs font-medium text-text-tertiary">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
    </header>
  )
}
