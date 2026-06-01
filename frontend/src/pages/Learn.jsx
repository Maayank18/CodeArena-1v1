import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import PremiumGate from '../components/PremiumGate';
import { useAuthSession } from '../context/AuthSessionContext.jsx';

const Learn = () => {
    const { user, isHydrated, clearSession, updateSession } = useAuthSession();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isHydrated) {
            return;
        }

        if (!user) {
            navigate('/login'); 
        }
    }, [isHydrated, navigate, user]);

    const handleLogout = () => {
        clearSession({
            clearDerived: true,
            eventDetail: { redirectTo: '/', replace: true },
        });
    };

    return (
        <div className="flex h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
            <Sidebar />
            
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                <Navbar user={user} onLogout={handleLogout} onUserUpdate={updateSession} />
                
                <main className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)] pb-32 md:pb-0 w-full relative p-4 md:p-8">
                    <div className="max-w-6xl mx-auto h-full flex flex-col">
                        <div className="mb-8">
                            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                                Learn & Master
                            </h1>
                            <p className="text-[var(--text-secondary)]">
                                In-depth tutorials, system design concepts, and advanced DSA patterns.
                            </p>
                        </div>

                        <div className="flex-1">
                            <PremiumGate requiredTier="plus">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="bg-[var(--surface-elevated)] p-6 rounded-2xl border border-[var(--border-color)]">
                                            <div className="h-32 bg-[var(--bg-tertiary)] rounded-xl mb-4"></div>
                                            <h3 className="text-lg font-bold mb-2">Advanced Graph Theory {i}</h3>
                                            <p className="text-[var(--text-secondary)] text-sm mb-4">Master complex graph algorithms and applications.</p>
                                            <button className="text-accent font-bold text-sm">Start Module &rarr;</button>
                                        </div>
                                    ))}
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

export default Learn;

// Version-2.0