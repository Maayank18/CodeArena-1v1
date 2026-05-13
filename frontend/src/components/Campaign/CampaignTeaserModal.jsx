import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Crown, Sparkles, Loader2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const CampaignTeaserModal = ({ isOpen }) => {
    const navigate = useNavigate();
    const [hasPending, setHasPending] = useState(false);
    const [isLoadingPending, setIsLoadingPending] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const checkPendingRequests = async () => {
            try {
                setIsLoadingPending(true);
                const res = await api.get('/payments/mine');
                const pending = res.data.transactions?.some((t) => t.status === 'pending');
                if (pending) {
                    setHasPending(true);
                }
            } catch (error) {
                console.error('Failed to check pending transactions:', error);
            } finally {
                setIsLoadingPending(false);
            }
        };
        checkPendingRequests();
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-amber-300/20 bg-[#07080d]/95 px-8 py-7 sm:py-8 shadow-[0_30px_120px_rgba(0,0,0,0.65)]"
                        style={{ minHeight: 'min(42rem, calc(100vh - 2rem))' }}
                    >
                        <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-white/5" />
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(217,70,239,0.14),_transparent_30%)]" />
                        <div className="pointer-events-none absolute -left-14 top-10 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
                        <div className="pointer-events-none absolute -right-10 bottom-8 h-40 w-40 rounded-full bg-fuchsia-500/15 blur-3xl" />

                        <div className="relative z-10 flex h-full flex-col items-center justify-between gap-6 text-center">
                            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-amber-200/20 bg-amber-300/10 shadow-[0_0_36px_rgba(251,191,36,0.16)]">
                                <div className="flex h-[84px] w-[84px] items-center justify-center rounded-[24px] bg-black/35">
                                    <Crown className="h-11 w-11 text-amber-300 drop-shadow-[0_0_18px_rgba(251,191,36,0.55)]" />
                                </div>
                            </div>

                            <div className="space-y-4 flex-1 flex flex-col justify-center">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.26em] text-amber-100">
                                    <Sparkles size={12} />
                                    Premium Journey
                                </div>
                                <h2 className="text-3xl font-black leading-tight text-white">
                                    Your Journey Has Just Begun!
                                </h2>
                                <p className="mx-auto max-w-[18rem] text-sm leading-7 text-gray-300">
                                    You conquered the first trial, but the real Archipelago is still sealed.
                                    Upgrade to Premium to unlock intense Zone Boss battles, 50+ handcrafted story challenges,
                                    richer progression rewards, exclusive Campaign badges, and the full world map adventure.
                                </p>
                            </div>

                            <div className="w-full space-y-4 pt-1">
                                {isLoadingPending ? (
                                    <button
                                        disabled
                                        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-800 px-5 py-4 text-base font-black text-gray-500 transition-all"
                                    >
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Checking Status...</span>
                                    </button>
                                ) : hasPending ? (
                                    <button
                                        disabled
                                        className="group flex w-full flex-col items-center justify-center gap-1 rounded-2xl bg-amber-500/20 px-5 py-3 border border-amber-500/30 text-amber-300 transition-all shadow-[0_0_20px_rgba(250,204,21,0.1)]"
                                    >
                                        <div className="flex items-center gap-2 font-black">
                                            <Clock size={16} />
                                            <span>Verification Pending</span>
                                        </div>
                                        <span className="text-[10px] uppercase tracking-widest text-amber-500/80">Access will be granted within 24 hours</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate('/pricing')}
                                        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 px-5 py-4 text-base font-black text-black shadow-[0_0_36px_rgba(250,204,21,0.26)] transition-all hover:scale-[1.02] hover:shadow-[0_0_46px_rgba(250,204,21,0.4)] active:scale-[0.99]"
                                    >
                                        <span>Upgrade to Premium</span>
                                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                    </button>
                                )}
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="text-sm font-semibold text-gray-400 transition-colors hover:text-white"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CampaignTeaserModal;
