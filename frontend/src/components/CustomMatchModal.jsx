import React, { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Swords, Timer, HelpCircle, Zap, Loader2 } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const TOPIC_OPTIONS = [
    'Arrays', 'Strings', 'Trees', 'Graphs', 'Dynamic Programming',
    'Sorting', 'Binary Search', 'Linked Lists', 'Stacks', 'Queues',
    'Hash Tables', 'Recursion'
];

const TIME_OPTIONS = [
    { label: '10 min', value: 600 },
    { label: '20 min', value: 1200 },
    { label: '30 min', value: 1800 },
];

const CustomMatchModal = ({ isOpen, onClose, onRoomCreated }) => {
    const [numQuestions, setNumQuestions] = useState(3);
    const [timeLimit, setTimeLimit] = useState(1800);
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [createdRoom, setCreatedRoom] = useState(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [quota, setQuota] = useState(null);

    // Fetch quota on open
    useEffect(() => {
        if (isOpen) {
            setCreatedRoom(null);
            setCopied(false);
            api.get('/rooms/custom/quota')
                .then(res => {
                    if (res.data?.success) setQuota(res.data.quota);
                })
                .catch(() => setQuota(null));
        }
    }, [isOpen]);

    const toggleTopic = useCallback((topic) => {
        setSelectedTopics(prev =>
            prev.includes(topic)
                ? prev.filter(t => t !== topic)
                : [...prev, topic]
        );
    }, []);

    const handleCreate = async () => {
        setLoading(true);
        try {
            const res = await api.post('/rooms/custom', {
                timeLimit,
                numQuestions,
                topics: selectedTopics.map(t => t.toLowerCase()),
            });

            if (res.data?.success) {
                setCreatedRoom({
                    roomId: res.data.roomId,
                    joinToken: res.data.joinToken,
                    customSettings: res.data.customSettings || {
                        timeLimit,
                        numQuestions,
                        topics: selectedTopics.map(t => t.toLowerCase()),
                    },
                });
                if (res.data?.quota) setQuota(res.data.quota);
                toast.success('Custom battle room created!');
            }
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to create custom room';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (createdRoom?.roomId) {
            navigator.clipboard.writeText(createdRoom.roomId);
            setCopied(true);
            toast.success('Room code copied!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-[var(--surface-elevated)]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden">
                {/* Gradient accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-emerald-400 to-cyan-400" />

                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-emerald-600 flex items-center justify-center">
                            <Swords size={20} className="text-black" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[var(--text-primary)]">Custom Battle</h2>
                            <p className="text-xs text-[var(--text-secondary)]">Configure your private arena</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                        <X size={20} className="text-[var(--text-secondary)]" />
                    </button>
                </div>

                {/* Quota Display */}
                {quota && (
                    <div className="mx-6 mb-4 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-between">
                        <span className="text-xs font-bold text-accent uppercase tracking-wider">Daily Quota</span>
                        <span className="text-sm font-mono font-bold text-[var(--text-primary)]">
                            {quota.used}/{quota.limit === 'unlimited' ? '∞' : quota.limit} used
                        </span>
                    </div>
                )}

                {createdRoom ? (
                    /* ── Room Created State ─────────────────────────────── */
                    <div className="p-6 pt-2 space-y-6 text-center">
                        <div className="space-y-2">
                            <p className="text-sm text-[var(--text-secondary)]">Share this code with your opponent:</p>
                            <div className="flex items-center justify-center gap-3 bg-[var(--bg-primary)] rounded-2xl p-4 border border-[var(--border-color)]">
                                    <code className="text-3xl font-mono font-black text-accent tracking-[0.15em]">
                                    {createdRoom.roomId}
                                    </code>
                                <button
                                    onClick={handleCopy}
                                    className="p-2.5 rounded-xl bg-accent/20 hover:bg-accent/30 transition-colors"
                                >
                                    {copied ? <Check size={18} className="text-accent" /> : <Copy size={18} className="text-accent" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] font-bold hover:border-accent/50 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    onClose();
                                    if (onRoomCreated) onRoomCreated(createdRoom);
                                }}
                                className="flex-1 py-3 rounded-xl bg-accent text-black font-extrabold hover:bg-[#3bd175] transition-colors"
                            >
                                Enter Arena →
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Configuration State ────────────────────────────── */
                    <div className="p-6 pt-2 space-y-6">
                        {/* Number of Questions */}
                        <div>
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <HelpCircle size={12} /> Number of Questions
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setNumQuestions(n)}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                                            numQuestions === n
                                                ? 'bg-accent text-black scale-105 shadow-lg shadow-green-900/30'
                                                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-accent/50'
                                        }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Limit */}
                        <div>
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Timer size={12} /> Time Limit
                            </label>
                            <div className="flex gap-2">
                                {TIME_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setTimeLimit(opt.value)}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                                            timeLimit === opt.value
                                                ? 'bg-accent text-black scale-105 shadow-lg shadow-green-900/30'
                                                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-accent/50'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Topic Selection */}
                        <div>
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Zap size={12} /> Problem Topics
                                <span className="text-[10px] font-normal opacity-60">(optional)</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {TOPIC_OPTIONS.map(topic => (
                                    <button
                                        key={topic}
                                        onClick={() => toggleTopic(topic)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            selectedTopics.includes(topic)
                                                ? 'bg-accent text-black'
                                                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-accent/50'
                                        }`}
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Create Button */}
                        <button
                            onClick={handleCreate}
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-accent text-black font-extrabold text-base hover:bg-[#3bd175] transition-all shadow-lg shadow-green-900/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Swords size={18} />
                                    Generate Room Code
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomMatchModal;

// Version-2.0