import useAuth from '../../hooks/useAuth'
import { ROLE_LABELS } from '../../utils/roles'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 text-white rounded-lg px-3 py-1.5 font-bold text-sm">
          DCoC
        </div>
        <span className="text-gray-500 text-sm hidden sm:block">
          Digital Chain of Custody
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
          <p className="text-xs text-gray-500">{ROLE_LABELS[user?.role]}</p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-600 hover:text-red-600 px-3 py-1.5 border rounded-md hover:border-red-300 transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
