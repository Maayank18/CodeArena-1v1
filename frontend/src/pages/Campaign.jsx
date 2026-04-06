// // src/pages/Campaign.jsx  — V2
// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Loader2, Map, ArrowLeft, BookOpen } from 'lucide-react';
// import Navbar              from '../components/Navbar';
// import WorldMap            from '../components/Campaign/WorldMap';
// import NodeDetailPanel     from '../components/Campaign/NodeDetailPanel';
// import CampaignHUD         from '../components/Campaign/CampaignHUD';
// import SkillTreeModal      from '../components/Campaign/SkillTreeModal';
// import CampaignGuideModal  from '../components/Campaign/CampaignGuideModal';
// import api                 from '../api';
// import toast               from 'react-hot-toast';

// const Campaign = () => {
//     const navigate = useNavigate();

//     const [mapData,       setMapData]       = useState(null);
//     const [progress,      setProgress]      = useState(null);
//     const [loading,       setLoading]       = useState(true);
//     const [selectedNode,  setSelectedNode]  = useState(null);
//     const [showSkillTree, setShowSkillTree] = useState(false);
//     const [showGuide,     setShowGuide]     = useState(false);

//     const user = JSON.parse(localStorage.getItem('codearena_user') || '{}');

//     useEffect(() => {
//         let cancelled = false;
//         const load = async () => {
//             try {
//                 const [mapRes, progRes] = await Promise.all([
//                     api.get('/campaign/map'),
//                     api.get('/campaign/progress'),
//                 ]);
//                 if (cancelled) return;
//                 setMapData(mapRes.data.map || mapRes.data);
//                 setProgress(progRes.data.progress || progRes.data);
//             } catch (err) {
//                 if (cancelled) return;
//                 console.error('[CAMPAIGN]', err);
//                 toast.error('Failed to load Campaign world');
//             } finally {
//                 if (!cancelled) setLoading(false);
//             }
//         };
//         load();
//         return () => { cancelled = true; };
//     }, []);

//     const handleNodeClick      = useCallback(node   => setSelectedNode(node),             []);
//     const handleClosePanel     = useCallback(()     => setSelectedNode(null),              []);
//     const handleStartChallenge = useCallback(nodeId => navigate(`/campaign/${nodeId}`),    [navigate]);
//     const handleProgressUpdate = useCallback(updates => setProgress(p => ({ ...p, ...updates })), []);
//     const handleLogout = useCallback(() => {
//         localStorage.removeItem('codearena_user');
//         navigate('/');
//     }, [navigate]);

//     // ── Loading ──────────────────────────────────────────────────────────────
//     if (loading) {
//         return (
//             <div className="min-h-screen bg-[#060810] flex flex-col items-center justify-center gap-5">
//                 <div className="text-7xl select-none" style={{ animation: 'bounce 1s infinite' }}>🗺️</div>
//                 <div className="flex items-center gap-2.5 text-gray-500 font-bold text-sm">
//                     <Loader2 size={16} className="animate-spin text-accent" />
//                     Loading Campaign World...
//                 </div>
//             </div>
//         );
//     }

//     // ── Defensive: normalise mapData shape (backend may return { nodes:[] } or { map:{ nodes:[] } }) ──
//     const nodes = mapData?.nodes ?? [];

//     // ── Empty ────────────────────────────────────────────────────────────────
//     if (!nodes.length) {
//         return (
//             <div className="min-h-screen bg-[#060810] flex flex-col">
//                 <Navbar user={user} onLogout={handleLogout} />
//                 <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-4">
//                     <Map size={64} className="text-gray-800 opacity-40" />
//                     <div>
//                         <h2 className="text-2xl font-black text-gray-500 mb-2">No Campaign Nodes Yet</h2>
//                         <p className="text-gray-700 text-sm">Run the seed script to populate the map.</p>
//                         <code className="block mt-2 text-xs text-accent font-mono bg-gray-900/60 px-4 py-2 rounded-lg border border-gray-800">
//                             node backend/seeder.js
//                         </code>
//                     </div>
//                     <button
//                         onClick={() => navigate('/dashboard')}
//                         className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
//                     >
//                         <ArrowLeft size={15} /> Back to Dashboard
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     // ── Main ─────────────────────────────────────────────────────────────────
//     return (
//         <div className="h-screen bg-[#060810] flex flex-col overflow-hidden">
//             <Navbar user={user} onLogout={handleLogout} />

//             {/* ── Campaign HUD ─────────────────────────────────────────── */}
//             <CampaignHUD
//                 progress={progress}
//                 onOpenSkillTree={() => setShowSkillTree(true)}
//             >
//                 {/* Guide button injected into HUD via children */}
//                 <button
//                     onClick={() => setShowGuide(true)}
//                     className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-gray-200 hover:bg-gray-800/60 rounded-lg transition-colors text-xs font-bold border border-transparent hover:border-gray-700/40"
//                     title="How to Play"
//                 >
//                     <BookOpen size={14} />
//                     <span className="hidden sm:inline">Guide</span>
//                 </button>
//             </CampaignHUD>

//             {/* ── Map area ─────────────────────────────────────────────── */}
//             <div className="flex-1 relative overflow-hidden">
//                 <WorldMap
//                     nodes={nodes}
//                     progress={progress}
//                     onNodeClick={handleNodeClick}
//                     selectedNodeId={selectedNode?.nodeId}
//                 />

//                 {selectedNode && (
//                     <NodeDetailPanel
//                         node={selectedNode}
//                         progress={progress}
//                         onClose={handleClosePanel}
//                         onStartChallenge={handleStartChallenge}
//                     />
//                 )}

//                 {/* Mobile click-away for panel */}
//                 {selectedNode && (
//                     <div
//                         className="sm:hidden absolute inset-0 z-30"
//                         onClick={handleClosePanel}
//                     />
//                 )}
//             </div>

//             {/* ── Modals ───────────────────────────────────────────────── */}
//             <SkillTreeModal
//                 isOpen={showSkillTree}
//                 onClose={() => setShowSkillTree(false)}
//                 progress={progress}
//                 onProgressUpdate={handleProgressUpdate}
//             />

//             <CampaignGuideModal
//                 isOpen={showGuide}
//                 onClose={() => setShowGuide(false)}
//             />
//         </div>
//     );
// };

// export default Campaign;



































// src/pages/Campaign.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Clean, single version — all dead/commented code removed.
// Theme-aware: dark: semantic classes throughout.
// Layout: h-[100dvh] flex-col for iOS Safari.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Map, ArrowLeft, BookOpen } from 'lucide-react';
import Navbar             from '../components/Navbar';
import WorldMap           from '../components/Campaign/WorldMap';
import NodeDetailPanel    from '../components/Campaign/NodeDetailPanel';
import CampaignHUD        from '../components/Campaign/CampaignHUD';
import SkillTreeModal     from '../components/Campaign/SkillTreeModal';
import CampaignGuideModal from '../components/Campaign/CampaignGuideModal';
import api                from '../api';
import toast              from 'react-hot-toast';

const Campaign = () => {
  const navigate = useNavigate();

  const [mapData,       setMapData]       = useState(null);
  const [progress,      setProgress]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [selectedNode,  setSelectedNode]  = useState(null);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [showGuide,     setShowGuide]     = useState(false);

  // Safe JSON parse so corrupted localStorage doesn't throw
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('codearena_user') || '{}'); }
    catch { return {}; }
  })();

  // ── Load map + progress ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [mapRes, progRes] = await Promise.all([
          api.get('/campaign/map'),
          api.get('/campaign/progress'),
        ]);
        if (cancelled) return;

        // Backend may return { success, map: { nodes, grouped } } or flat { nodes }
        const rawMap = mapRes.data?.map || mapRes.data;
        setMapData(rawMap);

        // Progress may be nested under .progress or at the top level
        const rawProg = progRes.data?.progress || progRes.data;
        setProgress(rawProg);
      } catch (err) {
        if (cancelled) return;
        console.error('[CAMPAIGN]', err);
        toast.error('Failed to load Campaign world');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleNodeClick      = useCallback(node   => setSelectedNode(node),            []);
  const handleClosePanel     = useCallback(()     => setSelectedNode(null),            []);
  const handleStartChallenge = useCallback(nodeId => navigate(`/campaign/${nodeId}`),  [navigate]);
  const handleProgressUpdate = useCallback(updates => setProgress(p => ({ ...p, ...updates })), []);
  const handleLogout         = useCallback(() => {
    localStorage.removeItem('codearena_user');
    navigate('/');
  }, [navigate]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-[#060810] flex flex-col items-center justify-center gap-5">
      <div className="text-6xl select-none" style={{ animation: 'bounce 1s infinite' }}>🗺️</div>
      <div className="flex items-center gap-2.5 text-slate-500 dark:text-gray-500 font-bold text-sm">
        <Loader2 size={16} className="animate-spin text-cyan-500" />
        Loading Campaign World…
      </div>
    </div>
  );

  // Normalise — backend returns { nodes:[], grouped:{} } wrapped in `.map`
  const nodes = mapData?.nodes ?? [];

  // ── Empty / not seeded ─────────────────────────────────────────────────────
  // When nodes is empty, WorldMap falls back to generateMockWorld() automatically.
  // We still render the full page so the WorldMap can show mock data.
  // Only show the "seed" prompt if the backend is completely unreachable.

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-[#060810] flex flex-col overflow-hidden">
      <Navbar user={user} onLogout={handleLogout} />

      {/* ── Campaign HUD ─────────────────────────────────────────── */}
      <CampaignHUD
        progress={progress}
        onOpenSkillTree={() => setShowSkillTree(true)}
      >
        {/* Guide button — injected into HUD via children prop */}
        <button
          onClick={() => setShowGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5
                     text-slate-500 hover:text-slate-800
                     hover:bg-slate-200
                     dark:text-gray-500 dark:hover:text-gray-200
                     dark:hover:bg-gray-800/60
                     rounded-lg transition-colors text-xs font-bold
                     border border-transparent dark:hover:border-gray-700/40"
          title="How to Play"
        >
          <BookOpen size={14} />
          <span className="hidden sm:inline">Guide</span>
        </button>
      </CampaignHUD>

      {/* ── Map area ─────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        {/* WorldMap always renders; if nodes=[] it uses generateMockWorld() */}
        <WorldMap
          nodes={nodes}
          progress={progress}
          onNodeClick={handleNodeClick}
          selectedNodeId={selectedNode?.nodeId}
        />

        {/* Node detail panel — slide in on click */}
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            progress={progress}
            onClose={handleClosePanel}
            onStartChallenge={handleStartChallenge}
          />
        )}

        {/* Mobile: tap outside panel to close */}
        {selectedNode && (
          <div
            className="sm:hidden absolute inset-0 z-[25]"
            onClick={handleClosePanel}
          />
        )}

        {/* Seed prompt — shown ONLY when backend returned empty AND no progress */}
        {!nodes.length && !progress?.unlockedNodes?.length && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl px-4 py-3 text-center max-w-xs backdrop-blur-md">
              <p className="text-slate-400 text-xs mb-2">
                Showing demo map — run the seeder to enable progress saving
              </p>
              <code className="text-cyan-400 text-[11px] font-mono">
                node backend/seeder.js
              </code>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────── */}
      <SkillTreeModal
        isOpen={showSkillTree}
        onClose={() => setShowSkillTree(false)}
        progress={progress}
        onProgressUpdate={handleProgressUpdate}
      />
      <CampaignGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </div>
  );
};

export default Campaign;









