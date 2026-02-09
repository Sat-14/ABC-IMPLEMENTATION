import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, User, FileText, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TransferModal = ({ isOpen, onClose, onSubmit, users, loading }) => {
    const [formData, setFormData] = useState({ to_user_id: '', reason: '' });

    useEffect(() => {
        if (isOpen) {
            setFormData({ to_user_id: '', reason: '' });
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop with blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className="relative w-full max-w-lg bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl shadow-inner">
                                    <ArrowRightLeft size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Transfer Custody</h3>
                                    <p className="text-xs text-gray-500 font-medium">Initiate a secure chain of custody transfer</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            {/* Warning / Info Box */}
                            <div className="flex items-start gap-3 p-4 bg-amber-50/50 border border-amber-100/50 rounded-xl">
                                <ShieldAlert size={18} className="text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    This action will be permanently recorded in the immutable audit log. The recipient must verify receipt to complete the transfer.
                                </p>
                            </div>

                            <form id="transfer-form" onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <User size={14} className="text-blue-500" />
                                        Select Recipient
                                    </label>
                                    <div className="relative group">
                                        <select
                                            value={formData.to_user_id}
                                            onChange={(e) => setFormData({ ...formData, to_user_id: e.target.value })}
                                            required
                                            className="w-full pl-4 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none text-sm font-medium text-gray-700 group-hover:bg-white"
                                        >
                                            <option value="">Choose a user...</option>
                                            {users.map(u => (
                                                <option key={u.user_id} value={u.user_id}>
                                                    {u.full_name} — {u.role}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <FileText size={14} className="text-blue-500" />
                                        Reason for Transfer
                                    </label>
                                    <textarea
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        required
                                        rows={3}
                                        placeholder="e.g., Escalating for forensic analysis..."
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none text-sm font-medium text-gray-700 placeholder:text-gray-400 hover:bg-white"
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="transfer-form"
                                disabled={loading}
                                className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Confirm Transfer</span>
                                        <ArrowRightLeft size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TransferModal;
