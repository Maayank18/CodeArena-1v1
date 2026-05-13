import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Crown,
  Diamond,
  Headphones,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Star,
  Zap,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ChatWidget from '../components/ChatWIdget';
import SubscriptionModal from '../components/SubscriptionModal';

const Pricing = () => {
  const [user, setUser] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, plan: null });
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('codearena_user'));

    if (!storedUser) {
      navigate('/login');
      return;
    }

    setUser(storedUser);
  }, [navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('codearena_user');
    toast.success('Logged out successfully');
    navigate('/');
  }, [navigate]);

  const featuresPlus = [
    '100 1v1 battle/month',
    'Access to all code languages',
    'Custom battle rooms',
    'In-editor personal notes',
    'Access to your match history',
    'Access to leaderboards',
  ];

  const featuresPro = [
    'Everything in Plus',
    'Code visualization tool',
    'Access to learn section',
    'Analytics and insights',
    'Priority matchmaking',
    'Exclusive badges',
    'Profile customization',
  ];

  const featuresPremium = [
    'Everything in Pro',
    'Campaign Mode access',
    'Full AI support',
    'Advanced theme optimization',
    'Contest participation',
    'Weekly report generation',
    'Community support',
  ];

  const openPlanModal = useCallback((planType) => {
    const configs = {
      plus: {
        planId: 'plus',
        name: 'PLUS',
        basePrice: 49,
        features: featuresPlus,
        color: '#22c55e',
        icon: Star,
      },
      pro: {
        planId: 'pro',
        name: 'PRO',
        basePrice: 99,
        features: featuresPro,
        color: '#4aee88',
        icon: Crown,
      },
      premium: {
        planId: 'premium',
        name: 'PREMIUM',
        basePrice: 149,
        features: featuresPremium,
        color: '#a855f7',
        icon: Diamond,
      },
    };

    setModalConfig({ isOpen: true, plan: configs[planType] });
  }, [featuresPlus, featuresPro, featuresPremium]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Navbar user={user} onLogout={handleLogout} onUserUpdate={setUser} />

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] w-full relative pb-20 md:pb-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="min-h-full flex flex-col">
            <div className="max-w-6xl mx-auto p-4 md:p-8 flex-1 w-full relative z-10">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-12 gap-8">
                <div className="space-y-2">
                  <h1 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] tracking-tighter">
                    Upgrade to <span className="text-accent text-glow-accent">Pro</span>
                  </h1>
                  <p className="text-[var(--text-secondary)] text-sm md:text-lg max-w-xl leading-relaxed">
                    Choose the perfect plan, pay with the secure QR flow, and submit your 12-digit UTR for manual verification.
                  </p>
                </div>

                <div className="w-full xl:w-auto grid grid-cols-2 md:grid-cols-4 gap-0 bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-2xl shadow-black/20">
                  <div className="flex flex-col sm:flex-row items-center gap-3 p-5 border-r border-b md:border-b-0 border-[var(--border-color)] hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} className="text-accent" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm font-bold text-[var(--text-primary)]">Secure</p>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">Payments</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 p-5 border-b md:border-r md:border-b-0 border-[var(--border-color)] hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <RefreshCcw size={20} className="text-blue-400" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm font-bold text-[var(--text-primary)]">Audit</p>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">Tracked</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 p-5 border-r border-[var(--border-color)] hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <Zap size={20} className="text-yellow-400 fill-current" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm font-bold text-[var(--text-primary)]">Fast</p>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">Review</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 p-5 hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Headphones size={20} className="text-purple-400" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm font-bold text-[var(--text-primary)]">Email</p>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">Updates</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch pt-8">
                <div className="bg-[var(--bg-secondary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] flex flex-col hover:border-green-500/30 hover:shadow-[0_20px_50px_-20px_rgba(34,197,94,0.15)] transition-all duration-500 relative group">
                  <div className="absolute top-6 right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Star size={80} className="text-green-500" />
                  </div>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/10 group-hover:scale-110 transition-transform duration-500">
                      <Star className="text-green-500 fill-current" size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-green-500 tracking-tight">PLUS</h3>
                      <p className="text-[var(--text-secondary)] text-xs font-medium uppercase tracking-widest">Entry Level</p>
                    </div>
                  </div>

                  <div className="flex items-baseline mb-2">
                    <span className="text-5xl font-black text-[var(--text-primary)] whitespace-nowrap">Rs. 49</span>
                    <span className="text-[var(--text-secondary)] font-bold ml-1">/mo</span>
                  </div>

                  <div className="mb-8">
                    <span className="inline-block bg-green-500/10 text-green-500 text-[10px] font-black px-3 py-1 rounded-full border border-green-500/20 uppercase tracking-tighter">
                      Good starting point
                    </span>
                  </div>

                  <ul className="space-y-4 mb-10 flex-1">
                    {featuresPlus.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                        <span className="text-[var(--text-primary)] text-sm font-semibold">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => openPlanModal('plus')}
                    className="w-full py-4 rounded-2xl border-2 border-green-500/20 text-green-500 font-black hover:bg-green-500 text-sm hover:text-black transition-all duration-300"
                  >
                    Get Plus
                  </button>
                </div>

                <div className="relative group lg:-mt-6 lg:mb-6">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-black px-6 py-2 rounded-full text-[10px] font-black tracking-[0.2em] flex items-center gap-2 shadow-2xl shadow-accent/40 z-30 animate-bounce-slow">
                    <Star size={12} className="fill-current" /> MOST POPULAR
                  </div>

                  <div className="h-full bg-gradient-to-b from-[#1a2e20] to-[var(--bg-secondary)] p-[1px] rounded-[3rem] shadow-[0_30px_70px_-20px_rgba(74,238,136,0.3)] hover:shadow-[0_40px_80px_-20px_rgba(74,238,136,0.45)] transition-all duration-500">
                    <div className="bg-[var(--bg-secondary)] p-8 rounded-[2.95rem] h-full flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:bg-accent/10 transition-colors duration-700" />

                      <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center border border-accent/20 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(74,238,136,0.2)]">
                          <Crown className="text-accent fill-current drop-shadow-[0_0_8px_rgba(74,238,136,0.5)]" size={32} />
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-accent tracking-tight text-glow-accent">PRO</h3>
                          <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em]">Top Rated</p>
                        </div>
                      </div>

                      <div className="flex items-baseline mb-2 relative z-10">
                        <span className="text-6xl font-black text-[var(--text-primary)] whitespace-nowrap">Rs. 99</span>
                        <span className="text-[var(--text-secondary)] font-bold ml-1">/mo</span>
                      </div>

                      <div className="mb-8 relative z-10">
                        <span className="inline-block bg-accent/10 text-accent text-[10px] font-black px-3 py-1 rounded-full border border-accent/20 uppercase tracking-tighter">
                          Most Value Choice
                        </span>
                      </div>

                      <ul className="space-y-4 mb-10 flex-1 relative z-10">
                        {featuresPro.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-3">
                            <CheckCircle2 size={18} className="text-accent shrink-0 drop-shadow-sm" />
                            <span className="text-[var(--text-primary)] text-sm font-bold">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => openPlanModal('pro')}
                        className="w-full py-5 rounded-2xl bg-accent text-black font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(74,238,136,0.3)] hover:shadow-[0_15px_40px_rgba(74,238,136,0.5)] relative z-10"
                      >
                        Upgrade to Pro Now
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--bg-secondary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] flex flex-col hover:border-purple-500/30 hover:shadow-[0_20px_50px_-20px_rgba(168,85,247,0.15)] transition-all duration-500 relative group">
                  <div className="absolute top-6 right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Diamond size={80} className="text-purple-500" />
                  </div>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/10 group-hover:scale-110 transition-transform duration-500">
                      <Diamond className="text-purple-500 fill-current" size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-purple-500 tracking-tight">PREMIUM</h3>
                      <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-[0.2em]">Elite Status</p>
                    </div>
                  </div>

                  <div className="flex items-baseline mb-2">
                    <span className="text-5xl font-black text-[var(--text-primary)] whitespace-nowrap">Rs. 149</span>
                    <span className="text-[var(--text-secondary)] font-bold ml-1">/mo</span>
                  </div>

                  <div className="mb-8">
                    <span className="inline-block bg-purple-500/10 text-purple-400 text-[10px] font-black px-3 py-1 rounded-full border border-purple-500/20 uppercase tracking-tighter">
                      Ultimate Experience
                    </span>
                  </div>

                  <ul className="space-y-4 mb-10 flex-1">
                    {featuresPremium.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-purple-500 shrink-0" />
                        <span className="text-[var(--text-primary)] text-sm font-semibold">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => openPlanModal('premium')}
                    className="w-full py-4 rounded-2xl border-2 border-purple-500/20 text-purple-400 font-black hover:bg-purple-500 text-sm hover:text-black transition-all duration-300"
                  >
                    Go Premium
                  </button>
                </div>
              </div>

              <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                <div className="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border-color)] flex flex-col items-center text-center gap-3 hover:bg-white/5 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                    <ShieldCheck size={24} className="text-green-500" />
                  </div>
                  <div>
                    <h4 className="text-[var(--text-primary)] font-bold text-sm">Secure & Safe</h4>
                    <p className="text-[var(--text-secondary)] text-[10px] mt-1 font-medium leading-relaxed">Protected payment review with unique UTR tracking.</p>
                  </div>
                </div>

                <div className="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border-color)] flex flex-col items-center text-center gap-3 hover:bg-white/5 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                    <RefreshCcw size={24} className="text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="text-[var(--text-primary)] font-bold text-sm">Manual Review</h4>
                    <p className="text-[var(--text-secondary)] text-[10px] mt-1 font-medium leading-relaxed">Every submission is verified before premium access is granted.</p>
                  </div>
                </div>

                <div className="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border-color)] flex flex-col items-center text-center gap-3 hover:bg-white/5 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <Zap size={24} className="text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-[var(--text-primary)] font-bold text-sm">Clear Steps</h4>
                    <p className="text-[var(--text-secondary)] text-[10px] mt-1 font-medium leading-relaxed">Scan QR, pay the exact amount, then submit the 12-digit UTR.</p>
                  </div>
                </div>

                <div className="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border-color)] flex flex-col items-center text-center gap-3 hover:bg-white/5 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                    <Headphones size={24} className="text-purple-500" />
                  </div>
                  <div>
                    <h4 className="text-[var(--text-primary)] font-bold text-sm">Email Updates</h4>
                    <p className="text-[var(--text-secondary)] text-[10px] mt-1 font-medium leading-relaxed">Users get notified when the request is received, approved, or rejected.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ChatWidget user={user} />

      <SubscriptionModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((current) => ({ ...current, isOpen: false }))}
        plan={modalConfig.plan}
      />
    </div>
  );
};

export default Pricing;
