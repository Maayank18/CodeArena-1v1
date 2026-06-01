import React from 'react';
import { Crown, Lock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthSession } from '../context/AuthSessionContext.jsx';

const PremiumGate = ({ requiredTier = 'pro', compact = false, message, className = '', children }) => {
    const navigate = useNavigate();
    const { user } = useAuthSession();

    const userRole = user?.role?.toLowerCase() || 'user';
    const userPlan = user?.subscriptionPlan?.toLowerCase() || 'free';

    const tiers = { free: 0, plus: 1, pro: 2, premium: 3 };

    const isAdmin = userRole === 'admin';
    const hasAccess = isAdmin || (tiers[userPlan] >= (tiers[requiredTier] || 0));

    if (hasAccess) {
        return <>{children}</>;
    }

    if (compact) {
        return (
            <button
                onClick={() => navigate('/pricing?source=settings')}
                className={`w-full mt-3 group relative flex items-center justify-between gap-4 rounded-xl border border-yellow-500/10 bg-yellow-500/[0.02] p-3.5 transition-all hover:bg-yellow-500/[0.05] hover:border-yellow-500/30 overflow-hidden ${className}`}
            >
                {/* Subtle shine effect on hover */}
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent pointer-events-none" />
                
                <div className="flex items-center gap-3 relative z-10">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)] group-hover:scale-110 transition-transform">
                        <Lock size={14} />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black text-yellow-500/80 leading-none uppercase tracking-[0.15em] mb-1.5">
                            {requiredTier} Required
                        </p>
                        <p className="text-[11px] font-bold text-[var(--text-secondary)] leading-none group-hover:text-[var(--text-primary)] transition-colors">
                            {message || `Upgrade to ${requiredTier} to unlock`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 bg-yellow-500 text-black px-3 py-1.5 rounded-lg text-[10px] font-black shadow-[0_4px_12px_rgba(234,179,8,0.2)] group-hover:shadow-[0_4px_20px_rgba(234,179,8,0.4)] group-hover:scale-105 transition-all relative z-10">
                    UPGRADE <Zap size={10} className="fill-current" />
                </div>
            </button>
        );
    }

    return (
        <div className={`relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl bg-transparent ${className || 'min-h-[580px]'}`}>
            {/* Blurred Background Content */}
            <div className="absolute inset-0 blur-[6px] saturate-[1.2] brightness-[0.7] pointer-events-none select-none overflow-hidden transition-all duration-700">
                {children}
            </div>

            {/* Modal Overlay */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 bg-black/10 backdrop-blur-[1px]">
                {/* Floating Glass Card */}
                <div 
                    className="relative max-w-[320px] w-full px-6 pb-8 pt-12 rounded-[2rem] border border-white/10 bg-[#161618] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] flex flex-col items-center text-center mt-8"
                >
                    {/* Top Center Overlapping Icon */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                        <div className="absolute inset-[-10px] bg-amber-500/20 blur-[15px] rounded-full pointer-events-none" />
                        <div className="relative w-16 h-16 rounded-full border border-amber-500/50 bg-[#161618] flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                            {requiredTier === 'pro' ? <Crown className="w-8 h-8 text-amber-400" /> : <Lock className="w-8 h-8 text-amber-400" />}
                        </div>
                    </div>

                    <h3 className="text-[22px] font-black text-white mb-2 tracking-tight">
                        Unlock <span className="text-amber-400">
                            {requiredTier === 'pro' ? 'Pro Features' : requiredTier === 'plus' ? 'Plus Features' : 'Premium Features'}
                        </span>
                    </h3>
                    
                    <p className="text-gray-400 text-[12px] font-medium leading-relaxed mb-8 px-2">
                        {requiredTier === 'pro' 
                            ? 'Upgrade to Pro to unlock advanced Analytics, exclusive Contests, full AI assistance, and more.'
                            : 'Upgrade to Plus to unlock Full Language Access, advanced Match History, and more.'}
                    </p>

                    <button 
                        onClick={() => navigate('/pricing?source=settings')}
                        className="group relative flex items-center justify-center gap-2 w-[85%] py-3 rounded-full bg-[#f5a623] hover:bg-[#e09612] font-bold text-black text-[13px] transition-all hover:scale-105 active:scale-95 shadow-[0_10px_20px_-5px_rgba(245,166,35,0.4)]"
                    >
                        <Lock size={15} className="text-black/80" />
                        Upgrade Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PremiumGate;







// Version-2.0