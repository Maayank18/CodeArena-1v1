import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import ChatWidget from '../components/ChatWIdget';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, ShieldCheck, RefreshCcw, Zap, Headphones, Star, Crown, Diamond, CheckCircle2 } from 'lucide-react';

const Pricing = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const syncUser = () => {
      const storedUser = JSON.parse(localStorage.getItem('codearena_user'));
      if (!storedUser) {
        navigate('/login');
        return;
      }
      setUser(storedUser);
    };
    syncUser();
  }, [navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('codearena_user');
    toast.success('Logged out successfully');
    navigate('/');
  }, [navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  const featuresPlus = [
    "Unlimited 1v1 Battles",
    "Access to All Languages",
    "Basic Analytics",
    "Friend Challenges",
    "Community Support"
  ];

  const featuresPro = [
    "Everything in Plus",
    "Advanced Analytics",
    "Custom Battle Rooms",
    "Priority Matchmaking",
    "No Ads",
    "Exclusive Badges"
  ];

  const featuresPremium = [
    "Everything in Pro",
    "Detailed Performance Insights",
    "Voice Chat in Battles",
    "Early Access to New Features",
    "Profile Customization",
    "Premium Support"
  ];

  return (
    <div className="flex h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] w-full relative pb-20 md:pb-0">
          
          {/* Subtle Background Glows */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="min-h-full flex flex-col">
            <div className="max-w-6xl mx-auto p-4 md:p-8 flex-1 w-full relative z-10">
              
              {/* Header & Trust Panel */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                <div>
                  <h1 className="text-3xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-2 tracking-tight">
                    Upgrade to <span className="text-accent glow-green drop-shadow-md">Pro</span>
                  </h1>
                  <p className="text-[var(--text-secondary)] text-sm md:text-base max-w-lg">
                    Choose the perfect plan and take your coding battles to the next level.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border-color)] shadow-lg shadow-black/10">
                   <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-accent" />
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">Secure Payments</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">100% safe & encrypted</p>
                      </div>
                   </div>
                   <div className="w-px h-8 bg-[var(--border-color)] hidden sm:block"></div>
                   <div className="flex items-center gap-2">
                      <RefreshCcw size={18} className="text-blue-400" />
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">Cancel Anytime</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">No questions asked</p>
                      </div>
                   </div>
                   <div className="w-px h-8 bg-[var(--border-color)] hidden sm:block"></div>
                   <div className="flex items-center gap-2">
                      <Zap size={18} className="text-yellow-400 fill-current" />
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">Instant Access</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">Get started immediately</p>
                      </div>
                   </div>
                   <div className="w-px h-8 bg-[var(--border-color)] hidden sm:block"></div>
                   <div className="flex items-center gap-2">
                      <Headphones size={18} className="text-purple-400" />
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">24/7 Support</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">We're here for you</p>
                      </div>
                   </div>
                </div>
              </div>

              {/* Pricing Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center pt-8">
                
                {/* PLUS PLAN */}
                <div className="bg-[var(--bg-secondary)] p-8 rounded-3xl border border-[var(--border-color)] flex flex-col h-full hover:-translate-y-2 hover:border-accent/40 hover:shadow-[0_10px_40px_-15px_rgba(74,238,136,0.2)] transition-all duration-300 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Star size={100} className="text-green-500" />
                  </div>
                  
                  <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
                    <Star className="text-green-500 fill-current" size={28} />
                  </div>
                  
                  <h3 className="text-2xl font-black text-green-500 mb-1">PLUS</h3>
                  <p className="text-[var(--text-secondary)] text-sm mb-6">Perfect for getting started</p>
                  
                  <div className="flex items-baseline mb-2">
                    <span className="text-4xl font-extrabold text-[var(--text-primary)]">₹149</span>
                    <span className="text-[var(--text-secondary)] font-medium ml-1">/ month</span>
                  </div>
                  
                  <div className="mb-8">
                     <span className="inline-block bg-green-500/10 text-green-500 text-xs font-bold px-3 py-1 rounded-full border border-green-500/20">
                        Save up to 17%
                     </span>
                  </div>
                  
                  <div className="h-px w-full bg-[var(--border-color)] mb-8"></div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {featuresPlus.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                        <span className="text-[var(--text-primary)] text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button className="w-full py-4 rounded-xl border-2 border-green-500/20 text-green-500 font-bold hover:bg-green-500/10 transition-colors mt-auto">
                    Choose Plus
                  </button>
                </div>

                {/* PRO PLAN (MOST POPULAR) */}
                <div className="bg-[#1a2e20]/80 p-1 rounded-[2rem] border border-accent/50 shadow-[0_0_50px_-15px_rgba(74,238,136,0.3)] hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(74,238,136,0.5)] transition-all duration-300 relative lg:-mt-4 lg:mb-4 group">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-black px-4 py-1.5 rounded-full text-xs font-black tracking-wider flex items-center gap-1.5 shadow-lg shadow-green-900/50 z-20">
                    <Star size={12} className="fill-current" /> MOST POPULAR
                  </div>
                  
                  <div className="bg-[var(--bg-secondary)] p-8 rounded-[1.8rem] h-full flex flex-col relative overflow-hidden backdrop-blur-md">
                     {/* Inner decorative shapes */}
                     <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none group-hover:bg-accent/20 transition-colors duration-500"></div>

                     <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mb-6 border border-accent/20 relative z-10">
                        <Crown className="text-accent fill-current drop-shadow-[0_0_10px_rgba(74,238,136,0.5)]" size={32} />
                     </div>
                     
                     <h3 className="text-3xl font-black text-accent mb-1 relative z-10 drop-shadow-[0_0_8px_rgba(74,238,136,0.3)]">PRO</h3>
                     <p className="text-[var(--text-secondary)] text-sm mb-6 relative z-10">Level up your coding game</p>
                     
                     <div className="flex items-baseline mb-2 relative z-10">
                        <span className="text-5xl font-extrabold text-[var(--text-primary)]">₹249</span>
                        <span className="text-[var(--text-secondary)] font-medium ml-1">/ month</span>
                     </div>
                     
                     <div className="mb-8 relative z-10">
                        <span className="inline-block bg-[#1a2e20] text-accent text-xs font-bold px-3 py-1 rounded-full border border-accent/20">
                           Save up to 17%
                        </span>
                     </div>
                     
                     <div className="h-px w-full bg-[var(--border-color)] mb-8 relative z-10"></div>
                     
                     <ul className="space-y-4 mb-8 flex-1 relative z-10">
                        {featuresPro.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                           <CheckCircle2 size={18} className="text-accent shrink-0 mt-0.5 drop-shadow-sm" />
                           <span className="text-[var(--text-primary)] text-sm font-medium">{feature}</span>
                        </li>
                        ))}
                     </ul>
                     
                     <button className="w-full py-4 rounded-xl bg-accent text-black font-extrabold hover:bg-[#3bd175] transition-all shadow-[0_0_20px_rgba(74,238,136,0.3)] hover:shadow-[0_0_30px_rgba(74,238,136,0.5)] mt-auto relative z-10 hover:scale-[1.02] active:scale-[0.98]">
                        Choose Pro
                     </button>
                  </div>
                </div>

                {/* PREMIUM PLAN */}
                <div className="bg-[var(--bg-secondary)] p-8 rounded-3xl border border-[var(--border-color)] flex flex-col h-full hover:-translate-y-2 hover:border-purple-500/40 hover:shadow-[0_10px_40px_-15px_rgba(168,85,247,0.2)] transition-all duration-300 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Diamond size={100} className="text-purple-500" />
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/10">
                    <Diamond className="text-purple-500 fill-current" size={28} />
                  </div>
                  
                  <h3 className="text-2xl font-black text-purple-500 mb-1">PREMIUM</h3>
                  <p className="text-[var(--text-secondary)] text-sm mb-6">For the ultimate champions</p>
                  
                  <div className="flex items-baseline mb-2">
                    <span className="text-4xl font-extrabold text-[var(--text-primary)]">₹349</span>
                    <span className="text-[var(--text-secondary)] font-medium ml-1">/ month</span>
                  </div>
                  
                  <div className="mb-8">
                     <span className="inline-block bg-purple-500/10 text-purple-400 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/20">
                        Save up to 30%
                     </span>
                  </div>
                  
                  <div className="h-px w-full bg-[var(--border-color)] mb-8"></div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {featuresPremium.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 size={18} className="text-purple-500 shrink-0 mt-0.5" />
                        <span className="text-[var(--text-primary)] text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button className="w-full py-4 rounded-xl border-2 border-purple-500/20 text-purple-400 font-bold hover:bg-purple-500/10 transition-colors mt-auto">
                    Choose Premium
                  </button>
                </div>

              </div>

              {/* Reassurance Strip Bottom */}
              <div className="mt-16 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg">
                 <div className="flex items-center gap-4">
                    <ShieldCheck size={32} className="text-green-500" />
                    <div>
                       <h4 className="text-[var(--text-primary)] font-bold text-sm">Secure & Safe</h4>
                       <p className="text-[var(--text-secondary)] text-xs mt-1">Your payment information<br/>is encrypted and secure.</p>
                    </div>
                 </div>
                 <div className="hidden md:block w-px h-12 bg-[var(--border-color)]"></div>
                 <div className="flex items-center gap-4">
                    <RefreshCcw size={32} className="text-yellow-500" />
                    <div>
                       <h4 className="text-[var(--text-primary)] font-bold text-sm">Cancel Anytime</h4>
                       <p className="text-[var(--text-secondary)] text-xs mt-1">Change or cancel your plan<br/>anytime. No hassle.</p>
                    </div>
                 </div>
                 <div className="hidden md:block w-px h-12 bg-[var(--border-color)]"></div>
                 <div className="flex items-center gap-4">
                    <Zap size={32} className="text-blue-500" />
                    <div>
                       <h4 className="text-[var(--text-primary)] font-bold text-sm">Instant Upgrade</h4>
                       <p className="text-[var(--text-secondary)] text-xs mt-1">Get instant access to all<br/>premium features.</p>
                    </div>
                 </div>
                 <div className="hidden md:block w-px h-12 bg-[var(--border-color)]"></div>
                 <div className="flex items-center gap-4">
                    <Headphones size={32} className="text-purple-500" />
                    <div>
                       <h4 className="text-[var(--text-primary)] font-bold text-sm">Need Help?</h4>
                       <p className="text-[var(--text-secondary)] text-xs mt-1">Our support team is available<br/>24/7 to assist you.</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ChatWidget user={user} />
    </div>
  );
};

export default Pricing;
