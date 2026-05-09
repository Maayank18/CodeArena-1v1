import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const TeaserModal = ({ isOpen, onClose, title, message }) => {
    const navigate = useNavigate();
    const { isDark } = useTheme();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                {/* Backdrop */}
                 <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#0a0a0b] shadow-2xl transition-colors"
                >
                    {/* Background Accents */}
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-[80px]" />
                    <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />

                    {/* Content */}
                    <div className="relative px-8 py-10 text-center">
                        <button 
                            onClick={onClose}
                            className="absolute right-6 top-6 rounded-full p-2 text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
                            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white dark:bg-[#0a0a0b]">
                                <Crown className="h-10 w-10 text-amber-400" />
                            </div>
                        </div>

                        <h2 className="mb-3 text-3xl font-black tracking-tight text-gray-800 dark:text-white">
                            {title || "Unlock Premium"}
                        </h2>
                        
                        <p className="mb-10 text-lg leading-relaxed text-gray-500 dark:text-gray-400">
                            {message || "Upgrade your plan to access this exclusive feature and take your coding skills to the next level."}
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/pricing');
                                }}
                                className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 py-4 text-lg font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <span>Upgrade to Premium</span>
                                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                            </button>
                            
                             <button
                                onClick={onClose}
                                className="rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400 transition-all hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-800 dark:hover:text-white"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>

                    {/* Bottom Gradient Line */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TeaserModal;
