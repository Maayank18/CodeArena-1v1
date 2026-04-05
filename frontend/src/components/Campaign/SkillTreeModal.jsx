// // src/components/Campaign/SkillTreeModal.jsx
// import React, { useState } from 'react';
// import { AnimatePresence, motion } from 'framer-motion';
// import { X, Zap, Check, Lock, ShoppingBag } from 'lucide-react';
// import api from '../../api';
// import toast from 'react-hot-toast';

// const ITEMS = [
//     { itemId: 'theme_matrix',    itemType: 'theme',  cost: 100, name: 'Matrix Theme',    desc: 'Green rain overlay in your arena',    emoji: '🟩', locked: false },
//     { itemId: 'theme_cyberpunk', itemType: 'theme',  cost: 150, name: 'Cyberpunk Theme', desc: 'Neon city aesthetic across the UI',    emoji: '🌆', locked: false },
//     { itemId: 'border_gold',     itemType: 'border', cost: 80,  name: 'Gold Border',     desc: 'Golden ring on your arena profile',   emoji: '🥇', locked: false },
//     { itemId: 'border_neon',     itemType: 'border', cost: 120, name: 'Neon Border',     desc: 'Glowing neon ring on your profile',   emoji: '💜', locked: false },
//     { itemId: 'title_knight',    itemType: 'title',  cost: 120, name: 'Code Knight',     desc: '"Code Knight" title in arena',        emoji: '⚔️', locked: false },
//     { itemId: 'title_arrayking', itemType: 'title',  cost: 200, name: 'Array King',      desc: '"Array King" — defeat the Array Boss', emoji: '👑', locked: true  },
// ];

// const TYPE_COLOR = {
//     theme:  { badge: 'bg-blue-950/40 text-blue-400 border-blue-800/50',   ring: 'border-blue-700/40'   },
//     border: { badge: 'bg-amber-950/40 text-amber-400 border-amber-800/50', ring: 'border-amber-700/40'  },
//     title:  { badge: 'bg-purple-950/40 text-purple-400 border-purple-800/50', ring: 'border-purple-700/40' },
// };

// const SkillTreeModal = ({ isOpen, onClose, progress, onProgressUpdate }) => {
//     const [buying, setBuying] = useState(null);

//     const currentKP = progress?.knowledgePoints ?? 0;
//     // const owned     = (progress?.inventory ?? []).map(i => i.itemId);
//     const owned = (progress?.inventory ?? []).map(i => i.itemId);

//     const handleBuy = async (item) => {
//         if (owned.includes(item.itemId)) { toast('Already owned!'); return; }
//         if (currentKP < item.cost)       { toast.error(`Need ${item.cost - currentKP} more KP`); return; }

//         setBuying(item.itemId);
//         try {
//             const { data } = await api.post('/campaign/spend-kp', {
//                 itemId: item.itemId, itemType: item.itemType, cost: item.cost
//             });
//             if (data.success) {
//                 toast.success(`${item.name} unlocked! 🎉`);
//                 onProgressUpdate({
//                     knowledgePoints: data.remainingKP,
//                     inventory: [...(progress?.inventory ?? []), { itemId: item.itemId, itemType: item.itemType }],
//                 });
//             }
//         } catch (err) {
//             toast.error(err.response?.data?.message || 'Purchase failed');
//         } finally {
//             setBuying(null);
//         }
//     };

//     return (
//         <AnimatePresence>
//             {isOpen && (
//                 <motion.div
//                     initial={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     exit={{ opacity: 0 }}
//                     className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
//                     onClick={e => e.target === e.currentTarget && onClose()}
//                 >
//                     <motion.div
//                         initial={{ scale: 0.88, y: 24 }}
//                         animate={{ scale: 1,    y: 0  }}
//                         exit={{    scale: 0.88, y: 24 }}
//                         transition={{ type: 'spring', damping: 22, stiffness: 220 }}
//                         className="bg-[#0a0c12] border border-gray-800/60 rounded-2xl w-full max-w-[640px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
//                     >
//                         {/* Header */}
//                         <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/50">
//                             <div className="flex items-center gap-3">
//                                 <div className="w-9 h-9 rounded-xl bg-purple-950/50 border border-purple-600/30 flex items-center justify-center">
//                                     <ShoppingBag size={18} className="text-purple-400" />
//                                 </div>
//                                 <div>
//                                     <h2 className="font-black text-white text-lg">Skill Tree</h2>
//                                     <p className="text-[11px] text-gray-600">Spend KP on arena perks &amp; cosmetics</p>
//                                 </div>
//                             </div>
//                             <div className="flex items-center gap-3">
//                                 <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-lg">
//                                     <Zap size={13} className="text-accent" />
//                                     <span className="font-mono font-black text-accent text-sm">{currentKP}</span>
//                                     <span className="text-gray-600 text-[11px]">KP</span>
//                                 </div>
//                                 <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
//                                     <X size={18} />
//                                 </button>
//                             </div>
//                         </div>

//                         {/* Items */}
//                         <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
//                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                                 {ITEMS.map(item => {
//                                     const isOwned    = owned.includes(item.itemId);
//                                     const canAfford  = currentKP >= item.cost;
//                                     const isBuying   = buying === item.itemId;
//                                     const tc         = TYPE_COLOR[item.itemType] || TYPE_COLOR.theme;
//                                     // const isDisabled = item.locked || isBuying || isOwned;

//                                     return (
//                                         <div
//                                             key={item.itemId}
//                                             className={`relative p-4 rounded-xl border transition-all ${
//                                                 isOwned
//                                                     ? 'bg-emerald-950/15 border-emerald-800/30 opacity-70'
//                                                     : item.locked
//                                                         ? 'bg-gray-900/30 border-gray-800/30 opacity-40'
//                                                         : `bg-gray-900/40 ${tc.ring} hover:border-opacity-80`
//                                             }`}
//                                         >
//                                             {isOwned && (
//                                                 <div className="absolute top-3 right-3">
//                                                     <Check size={15} className="text-emerald-400" />
//                                                 </div>
//                                             )}
//                                             {item.locked && (
//                                                 <div className="absolute top-3 right-3">
//                                                     <Lock size={13} className="text-gray-600" />
//                                                 </div>
//                                             )}

//                                             <div className="flex items-start gap-3 mb-3">
//                                                 <span className="text-2xl select-none">{item.emoji}</span>
//                                                 <div className="flex-1 min-w-0">
//                                                     <div className="flex items-center gap-2 flex-wrap mb-0.5">
//                                                         <span className="font-bold text-[13px] text-white">{item.name}</span>
//                                                         <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${tc.badge}`}>
//                                                             {item.itemType}
//                                                         </span>
//                                                     </div>
//                                                     <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
//                                                 </div>
//                                             </div>

//                                             <div className="flex items-center justify-between">
//                                                 <div className="flex items-center gap-1">
//                                                     <Zap size={12} className={canAfford && !isOwned && !item.locked ? 'text-accent' : 'text-gray-700'} />
//                                                     <span className={`font-mono font-bold text-sm ${canAfford && !isOwned && !item.locked ? 'text-accent' : 'text-gray-700'}`}>
//                                                         {item.cost} KP
//                                                     </span>
//                                                 </div>

//                                                 {item.locked ? (
//                                                     <span className="text-[10px] text-gray-700 font-bold">Boss Reward</span>
//                                                 ) : isOwned ? (
//                                                     <span className="text-[11px] text-emerald-400 font-bold">Owned</span>
//                                                 ) : (
//                                                     <button
//                                                         onClick={() => handleBuy(item)}
//                                                         disabled={!canAfford || isBuying}
//                                                         className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
//                                                             canAfford
//                                                                 ? 'bg-accent hover:bg-[#3bd175] text-black'
//                                                                 : 'bg-gray-800/60 text-gray-600 cursor-not-allowed'
//                                                         }`}
//                                                     >
//                                                         {isBuying ? '...' : canAfford ? 'Buy' : 'Need KP'}
//                                                     </button>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         </div>
//                     </motion.div>
//                 </motion.div>
//             )}
//         </AnimatePresence>
//     );
// };

// export default SkillTreeModal;





















































// src/components/Campaign/SkillTreeModal.jsx  — V2
// ─────────────────────────────────────────────────────────────────────────────
// Responsive Skill Tree with strict KP-aware button states:
//   Already Owned  → "Equip" (green)
//   Affordable     → "Unlock (X KP)" (accent)
//   Not Affordable → "Need X More KP" (disabled, greyed)
//   Boss-Locked    → "Defeat [Boss] First" (purple, disabled)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Zap, Check, Lock, ChevronRight } from 'lucide-react';
import api   from '../../api';
import toast from 'react-hot-toast';

// ── Catalogue definition ──────────────────────────────────────────────────────
// `requiresBoss` = nodeId of the Zone Boss that must be defeated to unlock this item.
const CATALOGUE = [
  // Themes
  { itemId:'theme_matrix',    type:'theme',  name:'Matrix Theme',    cost:100, emoji:'🟩', desc:'Green digital rain across your arena.' },
  { itemId:'theme_cyberpunk', type:'theme',  name:'Cyberpunk Theme', cost:150, emoji:'🌆', desc:'Neon city aesthetic — pink & cyan grids.' },
  { itemId:'theme_void',      type:'theme',  name:'Void Theme',      cost:200, emoji:'🌌', desc:'Dark matter + void particle FX.' },
  // Borders
  { itemId:'border_gold',     type:'border', name:'Gold Ring',       cost:80,  emoji:'🥇', desc:'Premium gold border on your profile.' },
  { itemId:'border_neon',     type:'border', name:'Neon Ring',       cost:120, emoji:'💜', desc:'Electric border — glows in matches.' },
  { itemId:'border_fire',     type:'border', name:'Fire Ring',       cost:180, emoji:'🔥', desc:'Animated flame border. Intimidate.' },
  // Titles
  { itemId:'title_codeknight',  type:'title', name:'Code Knight',  cost:120, emoji:'⚔️',  desc:'Classic title, no boss requirement.' },
  { itemId:'title_arrayking',   type:'title', name:'Array King',   cost:200, emoji:'👑',  desc:'Defeat Array Archipelago Zone Boss.', requiresBoss:'aa_15' },
  { itemId:'title_stringlord',  type:'title', name:'String Lord',  cost:200, emoji:'📜',  desc:'Defeat String Shores Zone Boss.',     requiresBoss:'ss_15' },
  { itemId:'title_looplord',    type:'title', name:'Loop Lord',    cost:200, emoji:'🔄',  desc:'Defeat Loop Lagoon Zone Boss.',       requiresBoss:'ll_15' },
];

const TYPE_COLORS = {
  theme:  { badge:'bg-blue-950/40 text-blue-400 border-blue-800/50',   accent:'#60a5fa' },
  border: { badge:'bg-amber-950/40 text-amber-400 border-amber-800/50', accent:'#fbbf24' },
  title:  { badge:'bg-purple-950/40 text-purple-400 border-purple-800/50', accent:'#c084fc' },
};

// ── Item card ─────────────────────────────────────────────────────────────────
const ItemCard = ({ item, currentKP, ownedIds, equippedMap, completedBosses, onBuy, onEquip, isBuying }) => {
  const tc        = TYPE_COLORS[item.type] || TYPE_COLORS.theme;
  const owned     = ownedIds.includes(item.itemId);
  const equipped  = equippedMap[item.type] === item.itemId;
  const bossLocked= item.requiresBoss && !completedBosses.includes(item.requiresBoss);
  const canAfford = !bossLocked && currentKP >= item.cost;
  const shortage  = item.cost - currentKP;

  // Determine CTA
  let cta;
  if (owned) {
    cta = equipped
      ? <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1"><Check size={12}/> Equipped</span>
      : <button onClick={() => onEquip(item)}
          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-700/40 transition-all">
          Equip
        </button>;
  } else if (bossLocked) {
    cta = <button disabled
      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-purple-950/20 text-purple-600 border border-purple-900/40 cursor-not-allowed opacity-70 flex items-center gap-1">
      <Lock size={10}/> Boss Required
    </button>;
  } else if (canAfford) {
    cta = <button
      onClick={() => onBuy(item)}
      disabled={isBuying === item.itemId}
      className="px-3 py-1.5 rounded-lg text-[11px] font-black bg-accent hover:bg-[#3bd175] text-black transition-all disabled:opacity-60 flex items-center gap-1">
      <Zap size={11}/> {isBuying === item.itemId ? 'Buying...' : `Unlock · ${item.cost} KP`}
    </button>;
  } else {
    cta = <button disabled
      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-gray-900/40 text-gray-600 border border-gray-800/40 cursor-not-allowed">
      Need {shortage} more KP
    </button>;
  }

  return (
    <div className={`p-3.5 rounded-xl border transition-colors ${
      owned
        ? 'bg-emerald-950/10 border-emerald-800/30'
        : bossLocked
          ? 'bg-gray-900/20 border-gray-800/30 opacity-60'
          : 'bg-slate-100 dark:bg-gray-900/40 border-slate-200 dark:border-gray-800/40 hover:border-gray-700/60'
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl select-none shrink-0">{item.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-bold text-[13px] text-slate-900 dark:text-white">{item.name}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase ${tc.badge}`}>{item.type}</span>
            {owned && <span className="text-[9px] font-bold text-emerald-400">✓ Owned</span>}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-gray-500 leading-relaxed mb-2">{item.desc}</p>
          {item.requiresBoss && !owned && (
            <p className="text-[9px] text-purple-400 mb-2 flex items-center gap-1">
              <Lock size={9}/> Requires defeating: <span className="font-bold">{item.requiresBoss}</span>
            </p>
          )}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Zap size={11} className={canAfford && !owned && !bossLocked ? 'text-accent' : 'text-gray-700'}/>
              <span className={`text-[12px] font-black ${canAfford && !owned && !bossLocked ? 'text-accent' : 'text-gray-600'}`}>
                {item.cost} KP
              </span>
            </div>
            {cta}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main modal ────────────────────────────────────────────────────────────────
const SkillTreeModal = ({ isOpen, onClose, progress, onProgressUpdate }) => {
  const [activeType, setActiveType] = useState('theme');
  const [isBuying,   setIsBuying]   = useState(null); // itemId currently being purchased

  const currentKP       = progress?.knowledgePoints ?? 0;
  const ownedIds        = (progress?.inventory ?? []).map(i => i.itemId);
  const equippedMap     = {
    theme:  progress?.activeTheme  ?? '',
    border: progress?.activeBorder ?? '',
    title:  progress?.activeTitle  ?? '',
  };
  const completedBosses = progress?.completedNodes
    ?.filter(n => n.starsAwarded >= 1)
    .map(n => n.nodeId) ?? [];

  const handleBuy = useCallback(async (item) => {
    if (ownedIds.includes(item.itemId)) { toast('Already owned!'); return; }
    if (currentKP < item.cost) { toast.error(`Need ${item.cost - currentKP} more KP`); return; }

    setIsBuying(item.itemId);
    try {
      const { data } = await api.post('/campaign/spend-kp', {
        itemId:   item.itemId,
        itemType: item.type,
        cost:     item.cost,
      });
      if (data.success) {
        toast.success(`${item.name} unlocked! 🎉`);
        onProgressUpdate({
          knowledgePoints: data.remainingKP,
          inventory: [...(progress?.inventory ?? []), { itemId: item.itemId, itemType: item.type }],
        });
      } else {
        toast.error(data.message || 'Purchase failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed — try again');
    } finally {
      setIsBuying(null);
    }
  }, [ownedIds, currentKP, progress, onProgressUpdate]);

  const handleEquip = useCallback(async (item) => {
    try {
      await api.post('/campaign/equip', { itemId: item.itemId, itemType: item.type });
      toast.success(`${item.name} equipped!`);
      onProgressUpdate({ [`active${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`]: item.itemId });
    } catch {
      toast.error('Could not equip — try again');
    }
  }, [onProgressUpdate]);

  const filteredItems = CATALOGUE.filter(i => i.type === activeType);
  const ownedCount    = CATALOGUE.filter(i => ownedIds.includes(i.itemId)).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)' }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.94, y: 40, opacity: 0 }}
            animate={{ scale: 1,    y: 0,  opacity: 1 }}
            exit={{    scale: 0.94, y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className={`
              bg-white dark:bg-[#090b12]
              border-t sm:border border-slate-200 dark:border-gray-800/60
              rounded-t-2xl sm:rounded-2xl
              w-full sm:max-w-[90vw] sm:w-[620px]
              max-h-[85dvh] sm:max-h-[88dvh]
              flex flex-col overflow-hidden shadow-2xl
            `}
          >
            {/* Accent line */}
            <div className="h-0.5 bg-gradient-to-r from-purple-600/60 via-accent/60 to-amber-500/60 shrink-0"/>

            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-gray-800/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/50 border border-purple-300 dark:border-purple-700/30 flex items-center justify-center shrink-0">
                  <ShoppingBag size={17} className="text-purple-600 dark:text-purple-400"/>
                </div>
                <div>
                  <h2 className="font-black text-slate-900 dark:text-white text-[17px] leading-none">Skill Tree</h2>
                  <p className="text-[10px] text-slate-400 dark:text-gray-600 mt-0.5">{ownedCount}/{CATALOGUE.length} items owned</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/25 px-3 py-1.5 rounded-lg">
                  <Zap size={13} className="text-accent"/>
                  <span className="font-mono font-black text-accent text-sm tabular-nums">{currentKP}</span>
                  <span className="text-gray-600 text-[10px]">KP</span>
                </div>
                <button onClick={onClose}
                  className="p-1.5 text-slate-400 dark:text-gray-600 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <X size={18}/>
                </button>
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex px-4 pt-3 pb-0 gap-2 shrink-0 overflow-x-auto" style={{scrollbarWidth:'none'}}>
              {['theme','border','title'].map(type => {
                const ownedInType = CATALOGUE.filter(i => i.type === type && ownedIds.includes(i.itemId)).length;
                const totalInType = CATALOGUE.filter(i => i.type === type).length;
                const icons = { theme:'🎨', border:'🔵', title:'⚔️' };
                return (
                  <button key={type}
                    onClick={() => setActiveType(type)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex-shrink-0 ${
                      activeType === type
                        ? 'bg-purple-950/30 text-purple-300 border-purple-700/40'
                        : 'bg-slate-100 dark:bg-gray-900/40 text-slate-500 dark:text-gray-500 border-slate-200 dark:border-gray-800/40 hover:border-gray-700/60'
                    }`}
                  >
                    <span>{icons[type]}</span>
                    <span className="capitalize">{type}s</span>
                    <span className="text-[10px] opacity-60">{ownedInType}/{totalInType}</span>
                  </button>
                );
              })}
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 min-h-0">
              <AnimatePresence mode="wait">
                <motion.div key={activeType}
                  initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
                  transition={{ duration:0.16 }}
                  className="space-y-3"
                >
                  {filteredItems.map(item => (
                    <ItemCard
                      key={item.itemId}
                      item={item}
                      currentKP={currentKP}
                      ownedIds={ownedIds}
                      equippedMap={equippedMap}
                      completedBosses={completedBosses}
                      onBuy={handleBuy}
                      onEquip={handleEquip}
                      isBuying={isBuying}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* KP earn hint */}
            <div className="px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-gray-800/40 shrink-0 bg-slate-50 dark:bg-transparent">
              <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-gray-600">
                <Zap size={11} className="text-accent shrink-0"/>
                <span>Earn KP by completing nodes (10–120 KP each) and defeating zone bosses.</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SkillTreeModal;