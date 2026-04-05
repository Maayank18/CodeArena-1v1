// src/components/Campaign/CampaignGuideModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Map, Zap, Skull, ShoppingBag, Star, Trophy, ChevronRight } from 'lucide-react';

const TABS = [
  { id: 'journey',    label: 'Journey',    icon: Map        },
  { id: 'economy',    label: 'Economy',    icon: Zap        },
  { id: 'bosses',     label: 'Bosses',     icon: Skull      },
  { id: 'skilltree',  label: 'Skill Tree', icon: ShoppingBag },
];

// ── Tab content ───────────────────────────────────────────────────────────────

const JourneyTab = () => (
  <div className="space-y-4">
    <div className="text-center pb-1">
      <div className="text-5xl mb-3">🗺️</div>
      <h3 className="text-xl font-black text-white mb-1">Your Campaign Path</h3>
      <p className="text-gray-500 text-sm">A linear adventure through 15 islands of code.</p>
    </div>
    {[
      { icon:'🏝️', title:'Zone Selection', desc:'The overview screen shows all zones. Locked zones appear grey until the previous zone\'s Boss is defeated.' },
      { icon:'🔓', title:'Node Progression', desc:'Inside a zone, you must complete Node N before Node N+1 unlocks. No skipping allowed.' },
      { icon:'⭐', title:'Star Ratings', desc:'Each node awards 1–3 stars based on your execution speed. Stars earn Knowledge Points (KP).' },
      { icon:'🔁', title:'Replay Anytime', desc:'Completed nodes can be replayed to earn more stars and improve your KP total.' },
    ].map((item, i) => (
      <motion.div key={i}
        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
        className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800/50 hover:border-gray-700/60 transition-colors">
        <span className="text-2xl select-none shrink-0">{item.icon}</span>
        <div>
          <p className="font-bold text-[13px] text-white mb-1">{item.title}</p>
          <p className="text-[12px] text-gray-500 leading-relaxed">{item.desc}</p>
        </div>
      </motion.div>
    ))}
  </div>
);

const EconomyTab = () => (
  <div className="space-y-4">
    <div className="text-center pb-1">
      <div className="text-5xl mb-3">⚡</div>
      <h3 className="text-xl font-black text-white mb-1">Knowledge Points</h3>
      <p className="text-gray-500 text-sm">Earn KP by solving challenges. Spend it on cosmetics.</p>
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Earning KP</p>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[{ s:1, kp:'+10–50', label:'Pass All Cases' },{ s:2, kp:'+20–80', label:'Beat 2★ Time' },{ s:3, kp:'+35–120', label:'Optimal Speed' }].map(r => (
          <div key={r.s} className="text-center p-3 bg-gray-900/60 border border-gray-800/50 rounded-xl">
            <div className="flex justify-center gap-0.5 mb-1">
              {[1,2,3].map(i => <span key={i} style={{fontSize:11,color:i<=r.s?'#fbbf24':'#374151'}}>★</span>)}
            </div>
            <div className="text-base font-black text-accent">{r.kp}</div>
            <div className="text-[9px] text-gray-600 mt-0.5">{r.label}</div>
          </div>
        ))}
      </div>
    </div>
    <div className="p-4 bg-amber-950/15 border border-amber-800/30 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Trophy size={15} className="text-amber-400"/>
        <p className="font-bold text-amber-300 text-sm">Boss Bonus</p>
      </div>
      <p className="text-[12px] text-gray-500">Mid-Bosses award up to <span className="text-amber-400 font-bold">80 KP</span>. Zone Bosses award up to <span className="text-amber-400 font-bold">120 KP</span> plus a chance at exclusive loot drops.</p>
    </div>
  </div>
);

const BossesTab = () => (
  <div className="space-y-4">
    <div className="text-center pb-1">
      <div className="text-5xl mb-3">💀</div>
      <h3 className="text-xl font-black text-white mb-1">Boss Battles</h3>
      <p className="text-gray-500 text-sm">Every zone has two guardians. Defeat them to progress.</p>
    </div>
    {[
      { emoji:'⚔️', title:'Mid-Boss (Node 8)', col:'border-purple-800/40 bg-purple-950/10', tCol:'text-purple-300',
        desc:'A Medium-difficulty challenge. Stricter time limits than standard nodes. Defeating it awards 30–80 KP and unlocks the second half of the zone.' },
      { emoji:'💀', title:'Zone Boss (Node 15)', col:'border-red-800/40 bg-red-950/10', tCol:'text-red-300',
        desc:'Hard difficulty. Requires optimal solutions. Defeating unlocks the NEXT zone entirely. Has a chance to drop exclusive cosmetics from its loot pool.' },
    ].map((item, i) => (
      <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*.1}}
        className={`p-4 rounded-xl border ${item.col}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{item.emoji}</span>
          <p className={`font-black text-[14px] ${item.tCol}`}>{item.title}</p>
        </div>
        <p className="text-[12px] text-gray-500 leading-relaxed">{item.desc}</p>
      </motion.div>
    ))}
    <div className="p-4 bg-purple-950/20 border border-purple-800/30 rounded-xl">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-full bg-purple-950/60 border border-purple-600/40 flex items-center justify-center">
          <span className="text-sm">✨</span>
        </div>
        <p className="font-black text-purple-200 text-sm">The Sage Appears</p>
      </div>
      <p className="text-[12px] text-gray-500 leading-relaxed">After <span className="text-purple-300 font-bold">3 failed attempts</span> on any node, "The Sage" AI mentor appears — offering a Socratic hint without writing the code for you.</p>
    </div>
  </div>
);

const SkillTreeTab = () => (
  <div className="space-y-4">
    <div className="text-center pb-1">
      <div className="text-5xl mb-3">🌳</div>
      <h3 className="text-xl font-black text-white mb-1">The Skill Tree</h3>
      <p className="text-gray-500 text-sm">Spend your KP on cosmetics and arena perks.</p>
    </div>

    {/* KP flow explainer */}
    <div className="flex items-center gap-2 p-3 bg-gray-900/50 rounded-xl border border-gray-800/40 text-[11px] text-gray-500">
      <span>Solve Nodes</span>
      <ChevronRight size={12} className="text-gray-700 shrink-0"/>
      <span className="text-amber-400 font-bold">Earn KP</span>
      <ChevronRight size={12} className="text-gray-700 shrink-0"/>
      <span>Open Skill Tree</span>
      <ChevronRight size={12} className="text-gray-700 shrink-0"/>
      <span className="text-accent font-bold">Buy Perks</span>
    </div>

    {/* Categories */}
    {[
      {
        emoji: '🎨', cat: 'Themes', col: 'text-blue-400', items: [
          { name: 'Matrix Theme',    cost: 100, desc: 'Green digital rain overlay across your arena.' },
          { name: 'Cyberpunk Theme', cost: 150, desc: 'Neon city aesthetic — pink & cyan grid lines.' },
          { name: 'Void Theme',      cost: 200, desc: 'Dark matter aesthetic with void particle FX.' },
        ],
      },
      {
        emoji: '🔵', cat: 'Borders', col: 'text-amber-400', items: [
          { name: 'Gold Ring',       cost: 80,  desc: 'Premium gold border on your arena profile.' },
          { name: 'Neon Ring',       cost: 120, desc: 'Electric neon border — glows in match view.' },
          { name: 'Fire Ring',       cost: 180, desc: 'Animated flame border. Intimidate opponents.' },
        ],
      },
      {
        emoji: '⚔️', cat: 'Titles', col: 'text-purple-400', items: [
          { name: 'Code Knight',  cost: 120, desc: 'Displayed beside your name in arena. No requirement.' },
          { name: 'Array King',   cost: 200, desc: 'Requires: defeat Array Archipelago Zone Boss.' },
          { name: 'String Lord',  cost: 200, desc: 'Requires: defeat String Shores Zone Boss.' },
          { name: 'Loop Lord',    cost: 200, desc: 'Requires: defeat Loop Lagoon Zone Boss.' },
        ],
      },
    ].map(section => (
      <div key={section.cat}>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-lg">{section.emoji}</span>
          <p className={`font-black text-[13px] ${section.col}`}>{section.cat}</p>
        </div>
        <div className="space-y-2 pl-2">
          {section.items.map((item, j) => (
            <div key={j} className="flex items-center justify-between px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-800/40">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-white">{item.name}</p>
                <p className="text-[10px] text-gray-600 truncate">{item.desc}</p>
              </div>
              <div className="flex items-center gap-1 ml-3 shrink-0">
                <Zap size={10} className="text-accent"/>
                <span className="text-[11px] font-black text-accent">{item.cost}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const TAB_CONTENT = { journey: JourneyTab, economy: EconomyTab, bosses: BossesTab, skilltree: SkillTreeTab };

// ── Main modal ────────────────────────────────────────────────────────────────
const CampaignGuideModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('journey');
  const Content = TAB_CONTENT[activeTab] || JourneyTab;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)' }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.88, y: 30, opacity: 0 }}
            animate={{ scale: 1,    y: 0,  opacity: 1 }}
            exit={{    scale: 0.88, y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 230 }}
            className="bg-[#090b12] border border-gray-800/60 rounded-2xl w-full max-w-[580px] max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Top accent */}
            <div className="h-0.5 bg-gradient-to-r from-cyan-600/50 via-purple-600/60 to-red-600/50"/>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-950/50 border border-cyan-700/30 flex items-center justify-center">
                  <Map size={17} className="text-cyan-400"/>
                </div>
                <div>
                  <h2 className="font-black text-white text-lg">How to Play</h2>
                  <p className="text-[10px] text-gray-600">Campaign Mode · Story Mode Guide</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 text-gray-600 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                <X size={17}/>
              </button>
            </div>

            {/* Tab bar — scrollable on mobile */}
            <div className="flex border-b border-gray-800/50 px-2 pt-1 gap-0.5 overflow-x-auto scrollbar-none">
              {TABS.map(tab => (
                <button key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold rounded-t-lg whitespace-nowrap transition-all flex-shrink-0 ${
                    activeTab === tab.id ? 'text-white' : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  <tab.icon size={12}/>
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div layoutId="guide-tab-bar"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                      style={{ background: 'linear-gradient(90deg, #06b6d4, #a855f7)' }}/>
                  )}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
              <AnimatePresence mode="wait">
                <motion.div key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{    opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                >
                  <Content/>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-800/40">
              <p className="text-[10px] text-gray-700">Master all zones to become the Algorithm Champion.</p>
              <button onClick={onClose}
                className="px-4 py-2 bg-accent hover:bg-[#3bd175] text-black text-xs font-black rounded-lg transition-all">
                Let's Go →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CampaignGuideModal;