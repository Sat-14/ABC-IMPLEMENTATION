import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { Bell, Settings, Menu, X, Clock, Activity, Shield, ArrowRight, Check, CheckCheck, AlertTriangle, ArrowLeftRight, FileUp } from 'lucide-react'
import { getAuditLogs } from '../../api/audit'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../api/notifications'
import { formatDate } from '../../utils/formatters'
import SearchDropdown from './SearchDropdown'

export default function Navbar({ onMenuClick, onSettingsClick, isMobile }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [recentLogs, setRecentLogs] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState('notifications')
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

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        getNotifications({ page: 1, per_page: 10 }),
        getUnreadCount(),
      ])
      setNotifications(notifRes.data.notifications || [])
      setUnreadCount(countRes.data.unread_count || 0)
    } catch {
      // Silent fail
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id)
      setNotifications(prev => prev.map(n =>
        n.notification_id === id ? { ...n, is_read: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* Silent */ }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch { /* Silent */ }
  }

  useEffect(() => {
    fetchLogs()
    fetchNotifications()
    const interval = setInterval(() => { fetchLogs(); fetchNotifications() }, 30000)
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
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 rounded-full border-2 border-white text-[10px] font-bold text-white px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              {/* Tabs */}
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex-1 px-4 py-3 text-xs font-bold tracking-wide transition-colors ${activeTab === 'notifications' ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/30' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Notifications {unreadCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">{unreadCount}</span>}
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex-1 px-4 py-3 text-xs font-bold tracking-wide transition-colors ${activeTab === 'activity' ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/30' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Activity
                </button>
              </div>

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <>
                  {unreadCount > 0 && (
                    <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-50 flex justify-end">
                      <button onClick={handleMarkAllRead} className="text-[11px] font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" /> Mark all read
                      </button>
                    </div>
                  )}
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div
                        key={n.notification_id}
                        onClick={() => {
                          if (!n.is_read) handleMarkRead(n.notification_id)
                          if (n.link) { setShowNotifications(false); navigate(n.link) }
                        }}
                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 ${!n.is_read ? 'bg-primary-50/20' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            n.type === 'integrity_failure' ? 'bg-red-50 text-red-500' :
                            n.type === 'transfer_completed' ? 'bg-green-50 text-green-500' :
                            n.type === 'transfer_rejected' ? 'bg-orange-50 text-orange-500' :
                            'bg-blue-50 text-blue-500'
                          }`}>
                            {n.type === 'integrity_failure' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                             n.type?.startsWith('transfer') ? <ArrowLeftRight className="w-3.5 h-3.5" /> :
                             <Bell className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-[#0F172A] mb-0.5">{n.title}</p>
                              {!n.is_read && <span className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0"></span>}
                            </div>
                            <p className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed">{n.message}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="text-[11px] text-slate-400 font-medium">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No notifications yet</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="max-h-[400px] overflow-y-auto">
                  {recentLogs.length > 0 ? recentLogs.map((log) => (
                    <div key={log.log_id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0">
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
                  )) : (
                    <div className="p-8 text-center">
                      <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No recent activity</p>
                    </div>
                  )}
                </div>
              )}

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
