import React, { useState, useEffect } from 'react';
import { Crown, Lock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PremiumGate = ({ requiredTier = 'pro', compact = false, message, children }) => {
    const navigate = useNavigate();
    
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('codearena_user') || '{}');
        } catch {
            return {};
        }
    });

    useEffect(() => {
        const handleUserUpdate = (e) => {
            setUser(e.detail || {});
        };
        window.addEventListener('codearena:user-updated', handleUserUpdate);
        
        const handleStorage = (e) => {
            if (e.key === 'codearena_user') {
                try {
                    setUser(JSON.parse(e.newValue || '{}'));
                } catch {
                    // ignore
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        
        return () => {
            window.removeEventListener('codearena:user-updated', handleUserUpdate);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

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
                className="w-full mt-3 group relative flex items-center justify-between gap-4 rounded-xl border border-yellow-500/10 bg-yellow-500/[0.02] p-3.5 transition-all hover:bg-yellow-500/[0.05] hover:border-yellow-500/30 overflow-hidden"
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
        <div className="relative w-full h-full min-h-[400px] overflow-hidden rounded-xl border border-gray-800 bg-[#060810]">
            {/* Blurred Content */}
            <div className="absolute inset-0 blur-md pointer-events-none opacity-50 select-none overflow-hidden">
                {children}
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.4)] relative">
                    <div className="absolute inset-1 bg-[#060810] rounded-full flex items-center justify-center">
                        <Crown className="w-10 h-10 text-amber-400" />
                    </div>
                </div>

                <h3 className="text-3xl font-bold text-white mb-3">
                    Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">Pro Features</span>
                </h3>
                
                <p className="text-gray-400 mb-8 max-w-md mx-auto text-lg">
                    {requiredTier === 'pro' 
                        ? 'Upgrade to Pro to unlock advanced Analytics, exclusive Contests, full AI assistance, and more.'
                        : 'Upgrade to Plus to unlock Full Language Access, advanced Match History, and more.'}
                </p>

                <button 
                    onClick={() => navigate('/pricing?source=settings')}
                    className="group relative px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 font-bold text-[#060810] text-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-95"
                >
                    <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <span className="flex items-center gap-2">
                        <Lock size={18} className="text-[#060810]" />
                        Upgrade Now
                    </span>
                </button>
            </div>
            
            {/* Dark gradient overlay to make text pop */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060810] via-transparent to-transparent pointer-events-none"></div>
        </div>
    );
};

export default PremiumGate;
