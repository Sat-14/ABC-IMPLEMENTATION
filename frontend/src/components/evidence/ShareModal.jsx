import React, { useState, useEffect } from 'react';
import { X, Share2, Clock, Mail, Copy, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createShareLink, getShareTokens, revokeShareToken } from '../../api/evidence';

const ShareModal = ({ isOpen, onClose, evidenceId }) => {
    const [formData, setFormData] = useState({ expiresInHours: 24, recipientEmail: '' });
    const [shareUrl, setShareUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tokens, setTokens] = useState([]);
    const [loadingTokens, setLoadingTokens] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setFormData({ expiresInHours: 24, recipientEmail: '' });
            setShareUrl('');
            setCopied(false);
            loadTokens();
        }
    }, [isOpen, evidenceId]);

    const loadTokens = async () => {
        setLoadingTokens(true);
        try {
            const { data } = await getShareTokens(evidenceId);
            setTokens(data.share_tokens || []);
        } catch (error) {
            console.error('Failed to load share tokens:', error);
        } finally {
            setLoadingTokens(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await createShareLink(
                evidenceId,
                formData.expiresInHours,
                formData.recipientEmail || null
            );
            setShareUrl(data.share_url);
            await loadTokens(); // Reload the list
        } catch (error) {
            console.error('Failed to create share link:', error);
            alert('Failed to create share link');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRevoke = async (tokenId) => {
        if (!confirm('Are you sure you want to revoke this share link?')) return;

        try {
            await revokeShareToken(tokenId);
            await loadTokens();
        } catch (error) {
            console.error('Failed to revoke token:', error);
            alert('Failed to revoke share link');
        }
    };

    const formatExpiration = (expiresAt) => {
        const date = new Date(expiresAt);
        const now = new Date();
        const diff = date - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return 'Less than 1 hour';
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`;
        const days = Math.floor(hours / 24);
        return `${days} day${days !== 1 ? 's' : ''}`;
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
                        className="relative w-full max-w-2xl bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 overflow-hidden max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100/50 bg-gradient-to-r from-purple-50/50 to-pink-50/50 flex items-center justify-between sticky top-0 z-10 bg-white/90 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl shadow-inner">
                                    <Share2 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Share Evidence</h3>
                                    <p className="text-xs text-gray-500 font-medium">Generate secure time-limited access link</p>
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
                        <div className="p-6 space-y-6">
                            {/* Create New Share Link */}
                            <form id="share-form" onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Clock size={14} className="text-purple-500" />
                                            Expiration
                                        </label>
                                        <select
                                            value={formData.expiresInHours}
                                            onChange={(e) => setFormData({ ...formData, expiresInHours: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm font-medium text-gray-700"
                                        >
                                            <option value={1}>1 Hour</option>
                                            <option value={24}>24 Hours</option>
                                            <option value={168}>7 Days</option>
                                            <option value={720}>30 Days</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Mail size={14} className="text-purple-500" />
                                            Recipient Email (Optional)
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.recipientEmail}
                                            onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                                            placeholder="user@example.com"
                                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm font-medium text-gray-700 placeholder:text-gray-400"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl shadow-lg shadow-purple-500/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Share2 size={16} />
                                            <span>Generate Share Link</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Generated Link */}
                            {shareUrl && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-green-50/50 border border-green-200 rounded-xl space-y-3"
                                >
                                    <p className="text-sm font-semibold text-green-800">✨ Share link generated!</p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={shareUrl}
                                            readOnly
                                            className="flex-1 px-4 py-2 bg-white border border-green-200 rounded-lg text-sm text-gray-700 font-mono"
                                        />
                                        <button
                                            onClick={handleCopy}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check size={16} />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={16} />
                                                    Copy
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Active Share Links */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-gray-700">Active Share Links</h4>
                                {loadingTokens ? (
                                    <p className="text-sm text-gray-500">Loading...</p>
                                ) : tokens.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No active share links</p>
                                ) : (
                                    <div className="space-y-2">
                                        {tokens.map((token) => (
                                            <div
                                                key={token.token_id}
                                                className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between"
                                            >
                                                <div className="flex-1">
                                                    <p className="text-xs font-semibold text-gray-700">
                                                        {token.recipient_email || 'No recipient specified'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Expires in {formatExpiration(token.expires_at)} • Accessed {token.access_count} time{token.access_count !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRevoke(token.token_id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Revoke"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ShareModal;
