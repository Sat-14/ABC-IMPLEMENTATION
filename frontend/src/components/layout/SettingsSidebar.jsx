import { X, User, Shield, Settings as SettingsIcon, Bell, CreditCard, ChevronRight, Fingerprint, Lock, ShieldCheck, Edit2, Check } from 'lucide-react'
import { useState } from 'react'
import useAuth from '../../hooks/useAuth'
import { clsx } from 'clsx'
import { Button } from '../common/Button'
import { updateUser } from '../../api/auth'

export default function SettingsSidebar({ isOpen, onClose }) {
    const { user } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || ''
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        setSuccess(false)
        try {
            await updateUser(user.user_id, formData)
            setSuccess(true)
            setIsEditing(false)
            // Refresh user data
            window.location.reload()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setFormData({
            full_name: user?.full_name || '',
            email: user?.email || ''
        })
        setIsEditing(false)
        setError(null)
    }

    const sections = [
        {
            title: 'Security',
            icon: Shield,
            items: [
                { label: 'Multi-Factor Auth', value: 'Enabled', icon: Lock, status: 'success' },
                { label: 'Digital Signature', value: 'Active', icon: Fingerprint, status: 'success' },
                { label: 'Session Integrity', value: 'Verified', icon: ShieldCheck, status: 'success' },
            ]
        },
        {
            title: 'System Preferences',
            icon: SettingsIcon,
            items: [
                { label: 'Retention Period', value: '7 Years', icon: ChevronRight },
                { label: 'Hash Algorithm', value: 'SHA-256', icon: ChevronRight },
                { label: 'Auto-Archival', value: 'On', icon: ChevronRight },
            ]
        }
    ]

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100] transition-opacity duration-300 animate-in fade-in"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed right-0 top-0 h-screen w-[400px] bg-white z-[110] shadow-2xl border-l border-[#E2E8F0] flex flex-col transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1)",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-[#E2E8F0]">
                    <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                        <SettingsIcon className="w-5 h-5 text-primary-500" />
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-50 text-[#64748B] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {/* User Profile Card */}
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-primary-500/10 transition-colors" />

                        {!isEditing ? (
                            <>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border-4 border-white shadow-lg text-white text-xl font-bold">
                                        {user?.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-extrabold text-[#0F172A]">{user?.full_name}</h3>
                                        <p className="text-sm font-bold text-primary-600 uppercase tracking-wider">{user?.role?.replace('_', ' ')}</p>
                                        <p className="text-xs text-[#94A3B8] font-medium mt-0.5">{user?.email}</p>
                                    </div>
                                </div>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full mt-6 bg-white border-[#E2E8F0] font-bold py-2.5"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </Button>
                            </>
                        ) : (
                            <div className="relative z-10 space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-bold">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 font-bold">
                                        Profile updated successfully!
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="flex-1 font-bold py-2.5"
                                        onClick={handleSave}
                                        isLoading={saving}
                                        disabled={saving}
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="flex-1 bg-white border-[#E2E8F0] font-bold py-2.5"
                                        onClick={handleCancel}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sections */}
                    {sections.map((section, idx) => (
                        <div key={idx} className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <section.icon className="w-4 h-4 text-primary-500" />
                                <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">{section.title}</h4>
                            </div>

                            <div className="space-y-2">
                                {section.items.map((item, i) => (
                                    <button
                                        key={i}
                                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-slate-50 text-[#64748B] group-hover:bg-white group-hover:text-primary-500 transition-colors">
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold text-[#475569] group-hover:text-[#0F172A]">{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={clsx(
                                                "text-[11px] font-extrabold px-2 py-1 rounded-full uppercase tracking-tight",
                                                item.status === 'success' ? "bg-green-100 text-green-700 font-black" : "text-[#94A3B8]"
                                            )}>
                                                {item.value}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Notifications Toggle (Simulated) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Bell className="w-4 h-4 text-primary-500" />
                            <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Notifications</h4>
                        </div>
                        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-[#475569]">Email Alerts</p>
                                <p className="text-[11px] text-[#94A3B8]">Critical integrity failures only</p>
                            </div>
                            <div className="w-11 h-6 bg-primary-500 rounded-full p-1 cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#E2E8F0] bg-[#F8FAFC]/50">
                    <p className="text-center text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">
                        Digital Chain of Custody v1.0.4
                    </p>
                </div>
            </aside>
        </>
    )
}
