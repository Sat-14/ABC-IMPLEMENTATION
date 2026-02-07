import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="text-xl text-gray-600 mt-4">Page not found</p>
        <Link to="/dashboard" className="inline-block mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
