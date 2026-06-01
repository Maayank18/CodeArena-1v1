import React, { useState } from 'react';

import { MessageCircle, HelpCircle, ChevronDown, ExternalLink, Users, Sparkles } from 'lucide-react';

const COMMUNITY_LINKS = [
    {
        name: 'VIP Discord Server',
        desc: 'Join 500+ members in real-time chat, pair programming, and weekly challenges.',
        url: '#',
        icon: MessageCircle,
        gradient: 'from-indigo-500 to-purple-600',
        glow: 'shadow-indigo-500/30',
        status: 'coming_soon'
    },
    {
        name: 'WhatsApp Community',
        desc: 'Get notified about contests, updates, and connect with fellow competitive coders.',
        url: 'https://chat.whatsapp.com/HPnSvhGyEemK7qjEkq8iWb',
        icon: Users,
        gradient: 'from-emerald-500 to-green-600',
        glow: 'shadow-emerald-500/30',
        status: 'active'
    },
    {
        name: 'Exclusive Events',
        desc: 'Access invite-only hackathons, AMAs with industry engineers, and mock interviews.',
        url: '#',
        icon: Sparkles,
        gradient: 'from-amber-500 to-orange-600',
        glow: 'shadow-amber-500/30',
        status: 'coming_soon'
    },
];

const FAQ_DATA = [
    {
        q: 'How does the ELO rating system work?',
        a: 'Your ELO starts at 1000. Wins against higher-rated opponents yield more points. Losses to lower-rated opponents cost more. The system is based on the standard chess ELO algorithm adapted for competitive coding.'
    },
    {
        q: 'Can I cancel my Pro subscription anytime?',
        a: 'Yes, you can cancel your Pro subscription at any time from the Subscription tab in Settings. Your Pro features will remain active until the end of the current billing cycle.'
    },
    {
        q: 'What happens to my badges if I downgrade?',
        a: 'Your earned badges are permanently stored and will remain on your profile even after downgrading. However, you will lose the ability to view the Badges gallery and customization features until you re-subscribe.'
    },
    {
        q: 'How are contest rankings calculated?',
        a: 'Contest rankings are based on a combination of problems solved, time taken, and penalty for wrong submissions. Ties are broken by earliest completion time.'
    },
    {
        q: 'Is there a free trial for Pro?',
        a: 'We occasionally run promotional trials. Follow our community channels to stay updated on special offers and seasonal discounts.'
    },
    {
        q: 'How does the Campaign mode difficulty scale?',
        a: 'Campaign nodes are arranged by region. Each region increases in difficulty. Nodes within a region follow a progressive unlock system where completing prerequisites unlocks harder challenges.'
    },
];

const AccordionItem = ({ item, isOpen, onToggle }) => (
    <div className="border border-[var(--border-color)] rounded-xl overflow-hidden transition-all">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-[var(--bg-tertiary)] transition-colors"
        >
            <span className="text-sm font-bold text-[var(--text-primary)] pr-4">{item.q}</span>
            <ChevronDown
                size={18}
                className={`text-[var(--text-secondary)] flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent' : ''}`}
            />
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
            <p className="px-5 pb-5 text-sm text-[var(--text-secondary)] leading-relaxed">{item.a}</p>
        </div>
    </div>
);

const CommunityTab = () => {
    const [openFaq, setOpenFaq] = useState(null);

    return (
        <div className="animate-fade-in">
            <div className="space-y-10">
                {/* Social Cards */}
                <section>
                    <h2 className="text-2xl font-black mb-2">CodeArena Community</h2>
                    <p className="text-[var(--text-secondary)] text-sm mb-6">Connect with coders across the globe.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {COMMUNITY_LINKS.map(link => {
                            const Icon = link.icon;
                            return (
                                <div
                                    key={link.name}
                                    className={`relative bg-[var(--bg-secondary)] backdrop-blur-md border border-[var(--border-color)] ring-1 ring-white/10 rounded-2xl p-6 shadow-2xl ${link.glow} transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]`}
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                                        <Icon className="text-[var(--text-primary)]" size={22} />
                                    </div>
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{link.name}</h3>
                                    <p className="text-sm text-[var(--text-secondary)] mb-5 leading-relaxed">{link.desc}</p>
                                    {link.status === 'active' ? (
                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-[#3bd175] transition-colors"
                                        >
                                            Join Now <ExternalLink size={14} />
                                        </a>
                                    ) : (
                                        <div className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--text-secondary)] opacity-50 cursor-default">
                                            Coming Soon
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* FAQ Section */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <HelpCircle size={20} className="text-amber-400" />
                        <h2 className="text-2xl font-black">Frequently Asked Questions</h2>
                    </div>
                    <div className="space-y-3 max-w-3xl">
                        {FAQ_DATA.map((item, idx) => (
                            <AccordionItem
                                key={idx}
                                item={item}
                                isOpen={openFaq === idx}
                                onToggle={() => setOpenFaq(prev => prev === idx ? null : idx)}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CommunityTab;

// Version-2.0