import { NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, FileText, Upload, ArrowRightLeft, History, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'
import useAuth from '../../hooks/useAuth'
import { hasPermission } from '../../utils/roles'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null },
  { path: '/cases', label: 'Cases', icon: FolderOpen, permission: 'view' },
  { path: '/evidence', label: 'Evidence', icon: FileText, permission: 'view' },
  { path: '/evidence/upload', label: 'Upload Evidence', icon: Upload, permission: 'upload' },
  { path: '/transfers', label: 'Transfers', icon: ArrowRightLeft, permission: 'view' },
  { path: '/audit', label: 'Audit Log', icon: History, permission: 'view' },
]

export default function Sidebar({ collapsed, setCollapsed, isMobile, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth()
  const [hovering, setHovering] = useState(null)

  const visibleItems = navItems.filter(
    item => !item.permission || hasPermission(user?.role, item.permission)
  )

  const width = isMobile ? (mobileOpen ? 240 : 0) : (collapsed ? 72 : 240)

  return (
    <>
      <aside
        className={clsx(
          "bg-white fixed left-0 top-0 h-screen z-50 flex flex-col border-r border-[#E2E8F0] shadow-[0_4px_6px_rgba(0,0,0,0.05)]",
          "transition-[width,transform] duration-300 cubic-bezier(0.4, 0, 0.2, 1)",
          isMobile && !mobileOpen ? "-translate-x-full" : "translate-x-0"
        )}
        style={{ width }}
      >
        {/* Logo Section */}
        <Link
          to="/dashboard"
          className="h-20 flex items-center border-b border-[#E2E8F0] px-4 group/logo overflow-hidden hover:bg-slate-50/50 transition-colors"
        >
          <div className={clsx(
            "flex items-center gap-3 transition-all duration-300",
            collapsed && !isMobile ? "mx-auto justify-center" : "w-full pl-1"
          )}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#06B6D4] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10 transition-transform duration-300 group-hover/logo:scale-105">
              <span className="font-bold text-white text-xl">D</span>
            </div>
            {!isMobile && (
              <span className={clsx(
                "font-bold text-[22px] tracking-tight text-[#0F172A] whitespace-nowrap transition-all duration-300",
                collapsed ? "opacity-0 translate-x-4 w-0 invisible" : "opacity-100 translate-x-0 w-auto visible"
              )}>
                DCoC<span className="text-[#3B82F6]">.ai</span>
              </span>
            )}
            {isMobile && (
              <span className="font-bold text-[22px] tracking-tight text-[#0F172A] whitespace-nowrap">
                DCoC<span className="text-[#3B82F6]">.ai</span>
              </span>
            )}
          </div>
        </Link>

        {/* Toggle Button (Desktop Only) */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={clsx(
              "absolute -right-3 top-[88px] w-6 h-6 bg-white border border-[#E2E8F0] rounded-full flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:shadow-md hover:scale-110 transition-all duration-300 z-[60]",
              collapsed ? "rotate-180" : "rotate-0 shadow-sm"
            )}
          >
            <ChevronLeft size={14} strokeWidth={3} />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden">
          {visibleItems.map(item => (
            <div
              key={item.path}
              className="relative"
              onMouseEnter={() => collapsed && setHovering(item.path)}
              onMouseLeave={() => setHovering(null)}
            >
              <NavLink
                to={item.path}
                end={item.path === '/evidence'}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 h-12 rounded-xl transition-all duration-200 group relative",
                    collapsed && !isMobile ? "justify-center px-0" : "px-4",
                    isActive
                      ? "bg-[#EFF6FF] text-[#3B82F6]"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={clsx(
                      "w-[22px] h-[22px] shrink-0 transition-colors duration-200",
                      isActive ? "text-[#3B82F6]" : "text-[#94A3B8] group-hover:text-[#64748B]"
                    )} />

                    <span className={clsx(
                      "text-sm font-semibold whitespace-nowrap transition-all duration-200",
                      collapsed && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100 delay-100"
                    )}>
                      {item.label}
                    </span>

                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#3B82F6] rounded-r-full" />
                    )}
                  </>
                )}
              </NavLink>

              {/* Tooltip for Collapsed State */}
              {collapsed && !isMobile && hovering === item.path && (
                <div className="fixed left-20 px-3 py-2 bg-[#0F172A] text-white text-xs font-bold rounded-lg shadow-xl z-[70] animate-in fade-in zoom-in-95 duration-150 delay-400">
                  {item.label}
                  <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-8 border-transparent border-right-[#0F172A]" />
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-[#E2E8F0]">
          <div className={clsx(
            "flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-300",
            collapsed && !isMobile ? "justify-center bg-transparent" : "bg-[#F8FAFC] border border-[#E2E8F0]"
          )}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shrink-0 border-2 border-white shadow-sm text-white">
              <span className="text-xs font-bold">
                {user?.full_name?.charAt(0) || 'U'}
              </span>
            </div>

            <div className={clsx(
              "flex-1 overflow-hidden transition-all duration-300",
              collapsed && !isMobile ? "opacity-0 w-0" : "opacity-100 delay-100"
            )}>
              <p className="text-sm font-bold text-[#0F172A] truncate leading-tight">{user?.full_name}</p>
              <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider truncate">{user?.role?.replace('_', ' ')}</p>
            </div>

            {(!collapsed || isMobile) && (
              <button
                onClick={logout}
                className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
