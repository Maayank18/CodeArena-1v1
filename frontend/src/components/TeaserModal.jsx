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
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
                {/* Reference-Quality Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="relative max-w-[360px] w-full px-8 py-12 rounded-[3rem] border border-white/10 bg-[#161618]/95 backdrop-blur-2xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] flex flex-col items-center text-center"
                >
                    {/* Background Glow Accents */}
                    <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-500/10 blur-[80px]" />

                    {/* Content */}
                    <div className="relative w-full flex flex-col items-center">
                        <button 
                            onClick={onClose}
                            className="absolute -right-2 -top-6 rounded-full p-2 text-gray-500 transition-all hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        {/* Premium Icon with Light Spotlight */}
                        <div className="relative mb-8">
                            <div className="absolute inset-[-15px] bg-amber-500/20 blur-[20px] rounded-full animate-pulse" />
                            <div className="relative w-16 h-16 rounded-full border border-amber-500/50 bg-[#161618] flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                                <Crown className="w-8 h-8 text-amber-400" />
                            </div>
                        </div>

                        <h2 className="mb-3 text-2xl font-black tracking-tight text-white">
                            {title || "Unlock Premium"}
                        </h2>
                        
                        <p className="mb-10 text-[13px] leading-relaxed text-gray-400 font-medium px-2">
                            {message || "Upgrade to Pro to unlock advanced Analytics, exclusive Contests, full AI assistance, and more."}
                        </p>

                        <div className="flex flex-col gap-4 w-full items-center">
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/pricing');
                                }}
                                className="group relative flex items-center gap-2 px-8 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 font-bold text-black text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_10px_25px_-5px_rgba(251,191,36,0.4)]"
                            >
                                <ArrowRight size={18} />
                                Upgrade Now
                            </button>
                            
                             <button
                                onClick={onClose}
                                className="text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TeaserModal;
