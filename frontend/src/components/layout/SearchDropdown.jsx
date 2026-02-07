import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Clock, FolderOpen, FileText, User, X, TrendingUp } from 'lucide-react'
import { clsx } from 'clsx'
import { globalSearch } from '../../api/search'

const SEARCH_HISTORY_KEY = 'dcoc-search-history'
const MAX_HISTORY = 10

export default function SearchDropdown() {
    const [query, setQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [results, setResults] = useState({ cases: [], evidence: [], users: [] })
    const [searchHistory, setSearchHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const inputRef = useRef(null)
    const dropdownRef = useRef(null)
    const debounceTimer = useRef(null)
    const navigate = useNavigate()

    // Load search history from localStorage
    useEffect(() => {
        const history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]')
        setSearchHistory(history)
    }, [])

    // Save search to history
    const saveToHistory = useCallback((searchQuery) => {
        if (!searchQuery.trim()) return

        const history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]')
        const newHistory = [searchQuery, ...history.filter(h => h !== searchQuery)].slice(0, MAX_HISTORY)
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
        setSearchHistory(newHistory)
    }, [])

    // Clear search history
    const clearHistory = () => {
        localStorage.removeItem(SEARCH_HISTORY_KEY)
        setSearchHistory([])
    }

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults({ cases: [], evidence: [], users: [] })
            setLoading(false)
            return
        }

        setLoading(true)
        clearTimeout(debounceTimer.current)

        debounceTimer.current = setTimeout(async () => {
            try {
                const response = await globalSearch(query, 5)
                setResults(response.data.results)
            } catch (error) {
                console.error('Search error:', error)
                setResults({ cases: [], evidence: [], users: [] })
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(debounceTimer.current)
    }, [query])

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Get all selectable items
    const getAllItems = () => {
        const items = []

        if (query.length < 2 && searchHistory.length > 0) {
            searchHistory.forEach((h, i) => items.push({ type: 'history', value: h, index: i }))
        } else {
            results.cases.forEach((c, i) => items.push({ type: 'case', data: c, index: i }))
            results.evidence.forEach((e, i) => items.push({ type: 'evidence', data: e, index: i }))
            results.users.forEach((u, i) => items.push({ type: 'user', data: u, index: i }))
        }

        return items
    }

    // Keyboard navigation
    const handleKeyDown = (e) => {
        const items = getAllItems()

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : prev))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault()
            const item = items[selectedIndex]
            handleItemClick(item)
        } else if (e.key === 'Escape') {
            setIsOpen(false)
            inputRef.current?.blur()
        }
    }

    // Handle item click
    const handleItemClick = (item) => {
        if (item.type === 'history') {
            setQuery(item.value)
            inputRef.current?.focus()
        } else if (item.type === 'case') {
            saveToHistory(query)
            navigate(`/cases/${item.data.case_id}`)
            setIsOpen(false)
            setQuery('')
        } else if (item.type === 'evidence') {
            saveToHistory(query)
            navigate(`/evidence/${item.data.evidence_id}`)
            setIsOpen(false)
            setQuery('')
        } else if (item.type === 'user') {
            saveToHistory(query)
            // Navigate to user profile or show user details (not implemented yet)
            setIsOpen(false)
            setQuery('')
        }
    }

    const hasResults = results.cases.length > 0 || results.evidence.length > 0 || results.users.length > 0

    return (
        <div className="relative flex-1 max-w-2xl" ref={dropdownRef}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search cases, evidence, or people..."
                    className="w-full h-12 pl-12 pr-10 bg-white border-2 border-[#E2E8F0] rounded-full text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-4 h-4 text-[#64748B]" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl max-h-[500px] overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {loading && (
                        <div className="p-8 text-center">
                            <div className="inline-block w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            <p className="mt-3 text-sm font-bold text-[#64748B]">Searching...</p>
                        </div>
                    )}

                    {!loading && query.length < 2 && searchHistory.length > 0 && (
                        <div className="p-3">
                            <div className="flex items-center justify-between px-3 py-2">
                                <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" />
                                    Recent Searches
                                </h4>
                                <button
                                    onClick={clearHistory}
                                    className="text-xs font-bold text-[#64748B] hover:text-[#EF4444] transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                            {searchHistory.map((h, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleItemClick({ type: 'history', value: h, index: i })}
                                    className={clsx(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                                        selectedIndex === i ? "bg-primary-50 text-primary-700" : "hover:bg-slate-50 text-[#475569]"
                                    )}
                                >
                                    <TrendingUp className="w-4 h-4 text-[#94A3B8]" />
                                    <span className="text-sm font-semibold">{h}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {!loading && query.length >= 2 && !hasResults && (
                        <div className="p-8 text-center">
                            <Search className="w-12 h-12 mx-auto text-[#CBD5E1] mb-3" />
                            <p className="text-sm font-bold text-[#64748B]">No results found for "{query}"</p>
                            <p className="text-xs text-[#94A3B8] mt-1">Try a different search term</p>
                        </div>
                    )}

                    {!loading && hasResults && (
                        <div className="p-3 space-y-4">
                            {/* Cases */}
                            {results.cases.length > 0 && (
                                <div>
                                    <h4 className="px-3 py-2 text-xs font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-2">
                                        <FolderOpen className="w-3.5 h-3.5" />
                                        Cases
                                    </h4>
                                    {results.cases.map((c, i) => (
                                        <button
                                            key={c.case_id}
                                            onClick={() => handleItemClick({ type: 'case', data: c, index: i })}
                                            className={clsx(
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                                                selectedIndex === i ? "bg-primary-50 text-primary-700" : "hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="p-2 rounded-lg bg-blue-50">
                                                <FolderOpen className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[#0F172A] truncate">{c.title}</p>
                                                <p className="text-xs text-[#64748B] font-semibold">{c.case_number}</p>
                                            </div>
                                            <span className={clsx(
                                                "text-[10px] font-extrabold px-2 py-1 rounded-full uppercase",
                                                c.status === 'open' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                            )}>
                                                {c.status}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Evidence */}
                            {results.evidence.length > 0 && (
                                <div>
                                    <h4 className="px-3 py-2 text-xs font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5" />
                                        Evidence
                                    </h4>
                                    {results.evidence.map((e, i) => (
                                        <button
                                            key={e.evidence_id}
                                            onClick={() => handleItemClick({ type: 'evidence', data: e, index: results.cases.length + i })}
                                            className={clsx(
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                                                selectedIndex === results.cases.length + i ? "bg-primary-50 text-primary-700" : "hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="p-2 rounded-lg bg-purple-50">
                                                <FileText className="w-4 h-4 text-purple-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[#0F172A] truncate">{e.file_name}</p>
                                                <p className="text-xs text-[#64748B] font-semibold">{e.file_type}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Users */}
                            {results.users.length > 0 && (
                                <div>
                                    <h4 className="px-3 py-2 text-xs font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-2">
                                        <User className="w-3.5 h-3.5" />
                                        Users
                                    </h4>
                                    {results.users.map((u, i) => (
                                        <button
                                            key={u.user_id}
                                            onClick={() => handleItemClick({ type: 'user', data: u, index: results.cases.length + results.evidence.length + i })}
                                            className={clsx(
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                                                selectedIndex === results.cases.length + results.evidence.length + i ? "bg-primary-50 text-primary-700" : "hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold">
                                                {u.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[#0F172A] truncate">{u.full_name}</p>
                                                <p className="text-xs text-[#64748B] font-semibold">{u.role?.replace('_', ' ')}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
