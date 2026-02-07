import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../api/notifications'
import { formatDate } from '../../utils/formatters'

const TYPE_STYLES = {
  transfer_requested: 'text-blue-600',
  transfer_approved: 'text-green-600',
  transfer_rejected: 'text-red-600',
  transfer_completed: 'text-green-700',
  integrity_failure: 'text-red-700',
  evidence_uploaded: 'text-blue-500',
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  // Poll for unread count every 30 seconds
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await getUnreadCount()
        setUnreadCount(res.data.unread_count)
      } catch {
        // Silent fail
      }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleOpen = async () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setLoading(true)
      try {
        const res = await getNotifications({ page: 1, per_page: 10 })
        setNotifications(res.data.notifications || [])
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id)
      setNotifications(prev => prev.map(n =>
        n.notification_id === id ? { ...n, is_read: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // Silent fail
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      // Silent fail
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        {/* Bell icon */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-72">
            {loading ? (
              <p className="p-4 text-sm text-gray-500">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No notifications</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.notification_id}
                  className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                  onClick={() => !n.is_read && handleMarkRead(n.notification_id)}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${TYPE_STYLES[n.type] || 'text-gray-900'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5 truncate">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                    </div>
                  </div>
                  {n.link && (
                    <Link
                      to={n.link}
                      className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                      onClick={() => setIsOpen(false)}
                    >
                      View details
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
