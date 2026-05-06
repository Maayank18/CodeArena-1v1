import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import PremiumGate from '../components/PremiumGate';

const Contest = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('codearena_user'));
        if (!storedUser) { 
            navigate('/login'); 
            return; 
        }
        setUser(storedUser);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('codearena_user');
        navigate('/');
    };

    return (
        <div className="flex h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
            <Sidebar />
            
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                <Navbar user={user} onLogout={handleLogout} onUserUpdate={setUser} />
                
                <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] pb-32 md:pb-0 w-full relative p-4 md:p-8">
                    <div className="max-w-6xl mx-auto h-full flex flex-col">
                        <div className="mb-8 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                                    Pro Contests
                                </h1>
                                <p className="text-[var(--text-secondary)]">
                                    Compete in exclusive weekly tournaments for cash prizes and badges.
                                </p>
                            </div>
                        </div>

                        <div className="flex-1">
                            <PremiumGate requiredTier="pro">
                                <div className="space-y-6">
                                    {/* Upcoming Contest */}
                                    <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 p-8 rounded-2xl relative overflow-hidden">
                                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl"></div>
                                        <div className="relative z-10">
                                            <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Upcoming</span>
                                            <h2 className="text-2xl font-bold mb-2">Weekly Championship #42</h2>
                                            <p className="text-[var(--text-secondary)] mb-6 max-w-lg">Prize pool: $500 • 4 Problems • 120 Minutes</p>
                                            <div className="flex gap-4">
                                                <button className="bg-amber-500 hover:bg-amber-400 text-[#060810] px-6 py-2 rounded-xl font-bold transition-colors">Register Now</button>
                                                <button className="bg-[var(--bg-tertiary)] hover:bg-[var(--surface-elevated)] border border-[var(--border-color)] px-6 py-2 rounded-xl font-bold transition-colors">View Details</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Past Contests */}
                                    <h3 className="text-xl font-bold mt-10 mb-4">Past Contests</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[41, 40, 39, 38].map(num => (
                                            <div key={num} className="bg-[var(--surface-elevated)] p-6 rounded-2xl border border-[var(--border-color)] flex justify-between items-center hover:border-[var(--text-secondary)] transition-colors cursor-pointer">
                                                <div>
                                                    <h4 className="font-bold">Weekly Championship #{num}</h4>
                                                    <p className="text-sm text-[var(--text-secondary)] mt-1">Ended • 2,451 Participants</p>
                                                </div>
                                                <button className="text-sm font-bold text-accent">Practice</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </PremiumGate>
                        </div>
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
};

export default Contest;
