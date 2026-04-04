// src/components/Campaign/SkillTreeModal.jsx
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Zap, Check, Lock, ShoppingBag } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

const ITEMS = [
    { itemId: 'theme_matrix',    itemType: 'theme',  cost: 100, name: 'Matrix Theme',    desc: 'Green rain overlay in your arena',    emoji: '🟩', locked: false },
    { itemId: 'theme_cyberpunk', itemType: 'theme',  cost: 150, name: 'Cyberpunk Theme', desc: 'Neon city aesthetic across the UI',    emoji: '🌆', locked: false },
    { itemId: 'border_gold',     itemType: 'border', cost: 80,  name: 'Gold Border',     desc: 'Golden ring on your arena profile',   emoji: '🥇', locked: false },
    { itemId: 'border_neon',     itemType: 'border', cost: 120, name: 'Neon Border',     desc: 'Glowing neon ring on your profile',   emoji: '💜', locked: false },
    { itemId: 'title_knight',    itemType: 'title',  cost: 120, name: 'Code Knight',     desc: '"Code Knight" title in arena',        emoji: '⚔️', locked: false },
    { itemId: 'title_arrayking', itemType: 'title',  cost: 200, name: 'Array King',      desc: '"Array King" — defeat the Array Boss', emoji: '👑', locked: true  },
];

const TYPE_COLOR = {
    theme:  { badge: 'bg-blue-950/40 text-blue-400 border-blue-800/50',   ring: 'border-blue-700/40'   },
    border: { badge: 'bg-amber-950/40 text-amber-400 border-amber-800/50', ring: 'border-amber-700/40'  },
    title:  { badge: 'bg-purple-950/40 text-purple-400 border-purple-800/50', ring: 'border-purple-700/40' },
};

const SkillTreeModal = ({ isOpen, onClose, progress, onProgressUpdate }) => {
    const [buying, setBuying] = useState(null);

    const currentKP = progress?.knowledgePoints ?? 0;
    // const owned     = (progress?.inventory ?? []).map(i => i.itemId);
    const owned = (progress?.inventory ?? []).map(i => i.itemId);

    const handleBuy = async (item) => {
        if (owned.includes(item.itemId)) { toast('Already owned!'); return; }
        if (currentKP < item.cost)       { toast.error(`Need ${item.cost - currentKP} more KP`); return; }

        setBuying(item.itemId);
        try {
            const { data } = await api.post('/campaign/spend-kp', {
                itemId: item.itemId, itemType: item.itemType, cost: item.cost
            });
            if (data.success) {
                toast.success(`${item.name} unlocked! 🎉`);
                onProgressUpdate({
                    knowledgePoints: data.remainingKP,
                    inventory: [...(progress?.inventory ?? []), { itemId: item.itemId, itemType: item.itemType }],
                });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Purchase failed');
        } finally {
            setBuying(null);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={e => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ scale: 0.88, y: 24 }}
                        animate={{ scale: 1,    y: 0  }}
                        exit={{    scale: 0.88, y: 24 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 220 }}
                        className="bg-[#0a0c12] border border-gray-800/60 rounded-2xl w-full max-w-[640px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-950/50 border border-purple-600/30 flex items-center justify-center">
                                    <ShoppingBag size={18} className="text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="font-black text-white text-lg">Skill Tree</h2>
                                    <p className="text-[11px] text-gray-600">Spend KP on arena perks &amp; cosmetics</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-lg">
                                    <Zap size={13} className="text-accent" />
                                    <span className="font-mono font-black text-accent text-sm">{currentKP}</span>
                                    <span className="text-gray-600 text-[11px]">KP</span>
                                </div>
                                <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {ITEMS.map(item => {
                                    const isOwned    = owned.includes(item.itemId);
                                    const canAfford  = currentKP >= item.cost;
                                    const isBuying   = buying === item.itemId;
                                    const tc         = TYPE_COLOR[item.itemType] || TYPE_COLOR.theme;
                                    // const isDisabled = item.locked || isBuying || isOwned;

                                    return (
                                        <div
                                            key={item.itemId}
                                            className={`relative p-4 rounded-xl border transition-all ${
                                                isOwned
                                                    ? 'bg-emerald-950/15 border-emerald-800/30 opacity-70'
                                                    : item.locked
                                                        ? 'bg-gray-900/30 border-gray-800/30 opacity-40'
                                                        : `bg-gray-900/40 ${tc.ring} hover:border-opacity-80`
                                            }`}
                                        >
                                            {isOwned && (
                                                <div className="absolute top-3 right-3">
                                                    <Check size={15} className="text-emerald-400" />
                                                </div>
                                            )}
                                            {item.locked && (
                                                <div className="absolute top-3 right-3">
                                                    <Lock size={13} className="text-gray-600" />
                                                </div>
                                            )}

                                            <div className="flex items-start gap-3 mb-3">
                                                <span className="text-2xl select-none">{item.emoji}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                        <span className="font-bold text-[13px] text-white">{item.name}</span>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${tc.badge}`}>
                                                            {item.itemType}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    <Zap size={12} className={canAfford && !isOwned && !item.locked ? 'text-accent' : 'text-gray-700'} />
                                                    <span className={`font-mono font-bold text-sm ${canAfford && !isOwned && !item.locked ? 'text-accent' : 'text-gray-700'}`}>
                                                        {item.cost} KP
                                                    </span>
                                                </div>

                                                {item.locked ? (
                                                    <span className="text-[10px] text-gray-700 font-bold">Boss Reward</span>
                                                ) : isOwned ? (
                                                    <span className="text-[11px] text-emerald-400 font-bold">Owned</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleBuy(item)}
                                                        disabled={!canAfford || isBuying}
                                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                                                            canAfford
                                                                ? 'bg-accent hover:bg-[#3bd175] text-black'
                                                                : 'bg-gray-800/60 text-gray-600 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        {isBuying ? '...' : canAfford ? 'Buy' : 'Need KP'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SkillTreeModal;
