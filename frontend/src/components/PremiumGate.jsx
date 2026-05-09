import React, { useState, useEffect } from 'react';
import { Crown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PremiumGate = ({ requiredTier = 'pro', compact = false, children }) => {
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
        
        // Also check if localStorage changed in another tab
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

    // DEBUG LOG
    console.log("[PREMIUM_GATE_DEBUG]", { 
        username: user?.username, 
        role: userRole, 
        plan: userPlan, 
        requiredTier 
    });

    const isAdmin = userRole === 'admin';
    const hasAccess = isAdmin || (tiers[userPlan] >= (tiers[requiredTier] || 0));

    if (hasAccess) {
        return <>{children}</>;
    }

    if (compact) {
        return (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300">
                    <Lock size={18} className="text-[#060810]" />
                </div>
                <p className="text-sm font-bold text-white">
                    {requiredTier === 'pro' ? 'Pro required' : 'Plus required'}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                    Upgrade to unlock this feature.
                </p>
                <button
                    onClick={() => navigate('/pricing?source=settings')}
                    className="mt-3 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-sm font-bold text-[#060810] transition-all hover:scale-105"
                >
                    Upgrade Now
                </button>
            </div>
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
