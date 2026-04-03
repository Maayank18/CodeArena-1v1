// src/components/Campaign/SagePanel.jsx
import React, { useState, useEffect, useRef } from 'react';
// motion
import { AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2 } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

const SagePanel = ({ nodeId, failedCode, errorMessage, language, isVisible, onClose }) => {
    const [hint, setHint]       = useState('');
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const prevNodeId = useRef(null);

    useEffect(() => {
        // Reset when node changes
        if (nodeId !== prevNodeId.current) {
            setHint('');
            setFetched(false);
            prevNodeId.current = nodeId;
        }
    }, [nodeId]);

    useEffect(() => {
        if (!isVisible || fetched || loading) return;
        const fetchHint = async () => {
            setLoading(true);
            try {
                const { data } = await api.post('/campaign/mentor', {
                    nodeId, failedCode, errorMessage, language
                });
                if (data.success) {
                    setHint(data.hint);
                    setFetched(true);
                } else {
                    toast.error('The Sage is resting. Try again shortly.');
                }
            } catch {
                toast.error('Could not reach The Sage.');
            } finally {
                setLoading(false);
            }
        };
        fetchHint();
    }, [isVisible, fetched, loading, nodeId, failedCode, errorMessage, language]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0,      opacity: 1 }}
                    exit={{    y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 210 }}
                    className="absolute bottom-0 left-0 right-0 bg-[#0a0510] border-t border-purple-900/35 z-30 shadow-2xl"
                >
                    {/* Purple glow top border */}
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

                    <div className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-purple-950/60 border border-purple-500/35 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                                    <Sparkles size={16} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-purple-200 leading-none">The Sage</p>
                                    <p className="text-[10px] text-gray-600 mt-0.5">Ancient Algorithm Mentor</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 text-gray-600 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Hint box */}
                        <div className="relative bg-purple-950/18 border border-purple-900/30 rounded-xl p-4 min-h-[60px] flex items-center">
                            {loading ? (
                                <div className="flex items-center gap-2.5 text-purple-400/70">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-sm italic">The Sage contemplates your code...</span>
                                </div>
                            ) : hint ? (
                                <p className="text-[13px] text-purple-200 leading-relaxed italic">
                                    &ldquo;{hint}&rdquo;
                                </p>
                            ) : (
                                <p className="text-sm text-gray-700 italic">Waiting for wisdom...</p>
                            )}
                        </div>

                        <p className="text-[10px] text-gray-700 text-center mt-2">
                            The Sage guides but does not solve. The insight must be yours.
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SagePanel;