import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSharedEvidence } from '../api/evidence';
import { Download, Eye, Clock, AlertCircle, Shield } from 'lucide-react';
import { formatDate, formatFileSize } from '../utils/formatters';

export default function SharedEvidencePage() {
    const { token } = useParams();
    const [evidence, setEvidence] = useState(null);
    const [shareInfo, setShareInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        loadEvidence();
    }, [token]);

    const loadEvidence = async () => {
        setLoading(true);
        setError('');
        try {
            const baseURL = window.location.origin;
            const { data } = await getSharedEvidence(token);
            setEvidence(data.evidence);
            setShareInfo(data.share_info);
        } catch (error) {
            console.error('Failed to load shared evidence:', error);
            if (error.response?.status === 403) {
                setError('This share link is invalid or has expired.');
            } else {
                setError('Failed to load evidence. Please check the link and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        const downloadUrl = `/api/evidence/public/shared/${token}/download`;
        window.location.href = downloadUrl;
    };

    const handlePreview = () => {
        setShowPreview(true);
    };

    const handleClosePreview = () => {
        setShowPreview(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading shared evidence...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-200 p-8">
                    <div className="flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mx-auto mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Access Denied</h2>
                    <p className="text-gray-600 text-center">{error}</p>
                </div>
            </div>
        );
    }

    const isPreviewable =
        evidence?.file_type?.startsWith('image/') ||
        evidence?.file_type?.startsWith('audio/') ||
        evidence?.file_type?.startsWith('video/') ||
        ['application/pdf'].includes(evidence?.file_type);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield size={32} />
                            <h1 className="text-2xl font-bold">Shared Evidence</h1>
                        </div>
                        <p className="text-purple-100 text-sm">
                            This evidence has been securely shared with you for review. All access is logged.
                        </p>
                    </div>

                    {/* Evidence Info */}
                    <div className="p-6 space-y-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">{evidence?.file_name}</h2>
                            <p className="text-sm text-gray-500">ID: {evidence?.evidence_id}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">File Size</p>
                                <p className="text-sm font-bold text-gray-900">{formatFileSize(evidence?.file_size)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">File Type</p>
                                <p className="text-sm font-bold text-gray-900">{evidence?.file_type || 'Unknown'}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Upload Date</p>
                                <p className="text-sm font-bold text-gray-900">{formatDate(evidence?.upload_date)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Link Expires</p>
                                <p className="text-sm font-bold text-gray-900">{formatDate(shareInfo?.expires_at)}</p>
                            </div>
                        </div>

                        {evidence?.description && (
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Description</p>
                                <p className="text-sm text-gray-700">{evidence.description}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            {isPreviewable && (
                                <button
                                    onClick={handlePreview}
                                    className="group flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white border border-purple-200 text-purple-600 rounded-2xl hover:bg-purple-50 hover:border-purple-300 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-sm hover:shadow-md font-bold text-sm"
                                >
                                    <Eye size={20} className="group-hover:scale-110 transition-transform" />
                                    <span>Preview Evidence</span>
                                </button>
                            )}
                            <button
                                onClick={handleDownload}
                                className="group flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-sm"
                            >
                                <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                                <span className="truncate">Download File</span>
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={14} />
                        <span>Shared by: {shareInfo?.created_by_email}</span>
                    </div>
                </div>

                {/* Watermark Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <p className="text-sm text-amber-800">
                        <strong>⚠️ Notice:</strong> This evidence is shared for authorized review only. All access is monitored and logged.
                    </p>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={handleClosePreview}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold text-gray-900">Preview</h3>
                            <button
                                onClick={handleClosePreview}
                                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 flex items-center justify-center min-h-[300px]">
                            {evidence?.file_type?.startsWith('video/') || evidence?.file_name?.toLowerCase().endsWith('.mp4') ? (
                                <video src={`/api/evidence/public/shared/${token}/download`} controls className="max-w-full max-h-[70vh]" />
                            ) : evidence?.file_type?.startsWith('audio/') || evidence?.file_name?.toLowerCase().match(/\.(mp3|wav|m4a)$/) ? (
                                <audio src={`/api/evidence/public/shared/${token}/download`} controls className="w-full" />
                            ) : evidence?.file_type?.startsWith('image/') ? (
                                <img src={`/api/evidence/public/shared/${token}/download`} alt="Evidence preview" className="max-w-full max-h-[70vh] object-contain" />
                            ) : (
                                <p className="text-gray-500">Preview not available for this file type</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
