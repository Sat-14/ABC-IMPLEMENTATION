import { NavLink } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { hasPermission } from '../../utils/roles'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', permission: null },
  { path: '/cases', label: 'Cases', permission: 'view' },
  { path: '/evidence', label: 'Evidence', permission: 'view' },
  { path: '/evidence/upload', label: 'Upload Evidence', permission: 'upload' },
  { path: '/transfers', label: 'Transfers', permission: 'view' },
  { path: '/audit', label: 'Audit Log', permission: 'view' },
]

export default function Sidebar() {
  const { user } = useAuth()

  const visibleItems = navItems.filter(
    item => !item.permission || hasPermission(user?.role, item.permission)
  )

  return (
    <aside className="w-56 bg-white border-r border-gray-200 min-h-[calc(100vh-57px)]">
      <nav className="p-4 space-y-1">
        {visibleItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/evidence'}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
