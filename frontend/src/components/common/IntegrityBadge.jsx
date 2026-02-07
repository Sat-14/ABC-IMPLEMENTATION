export default function IntegrityBadge({ status }) {
  const styles = {
    intact: 'bg-green-100 text-green-800 border-green-300',
    tampered: 'bg-red-100 text-red-800 border-red-300',
    unverified: 'bg-gray-100 text-gray-600 border-gray-300',
  }

  const labels = {
    intact: 'Intact',
    tampered: 'TAMPERED',
    unverified: 'Not Verified',
  }

  const icons = {
    intact: (
      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    tampered: (
      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    unverified: (
      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
  }

  const s = status || 'unverified'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[s]}`}>
      {icons[s]}
      {labels[s]}
    </span>
  )
}
