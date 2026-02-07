export function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function truncateHash(hash, length = 12) {
  if (!hash) return 'N/A'
  if (hash.length <= length) return hash
  return `${hash.slice(0, length)}...`
}

export function formatCategoryLabel(category) {
  if (!category) return 'N/A'
  return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
