// YE WALA REFRESH WALI PROBLEM KO SOLVE KARTA HAI + BADIA HAI 
import React, { useState, useEffect,useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { Loader2, BookOpen } from 'lucide-react';
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
  const location = useLocation(); // Hook to access navigation state

  const [mapData,       setMapData]       = useState(null);
  const [progress,      setProgress]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [selectedNode,  setSelectedNode]  = useState(null);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [showGuide,     setShowGuide]     = useState(false);

  // Safe JSON parse for user data
//   const user = (() => {
//     try { 
//       return JSON.parse(localStorage.getItem('codearena_user') || '{}'); 
//     } catch { 
//       return {}; 
//     }
//   })();

// Safe JSON parse, memoized to prevent infinite loops!
  const user = useMemo(() => {
    try { 
      return JSON.parse(localStorage.getItem('codearena_user') || '{}'); 
    } catch { 
      return {}; 
    }
  }, []); // <-- The empty array ensures it only parses once on mount

//   // ── Load map + progress ───────────────────────────────────────────────────
//   useEffect(() => {
//     // Auth Guard
//     if (!user || Object.keys(user).length === 0) {
//       toast.error('Please log in to access the campaign');
//       navigate('/');
//       return;
//     }

//     let cancelled = false;
    
//     const loadData = async () => {
//       // ✅ RACE CONDITION FIX: 
//       // If we arrived here from a successful submission, wait for DB consistency
//       if (location.state?.refetch) {
//         await new Promise(resolve => setTimeout(resolve, 500));
        
//         // Clean up navigation state so a manual refresh doesn't trigger the delay again
//         window.history.replaceState({}, document.title);
//       }

//       setLoading(true);
//       try {
//         const [mapRes, progRes] = await Promise.all([
//           api.get('/campaign/map'),
//           api.get('/campaign/progress'),
//         ]);
        
//         if (cancelled) return;

//         setMapData(mapRes.data?.map || mapRes.data);
//         setProgress(progRes.data?.progress || progRes.data);
//       } catch (err) {
//         if (cancelled) return;
//         console.error('[CAMPAIGN ERROR]', err);
//         toast.error('Failed to load Campaign world');
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     };

//     loadData();
    
//     return () => { 
//       cancelled = true; 
//     };
//   }, [navigate, location.state]); // ✅ Dependency on location.state triggers reload on navigation


// ── Load map + progress ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user || Object.keys(user).length === 0) {
      toast.error('Please log in to access the campaign');
      navigate('/');
      return;
    }

    let cancelled = false;
    
    const loadData = async () => {
      setLoading(true);

      // ✅ INSTANT UI UPDATE: Use the fresh progress passed from the Editor
      if (location.state?.newProgress) {
        setProgress(location.state.newProgress);
        // We still need the map data, but progress is instant
        try {
          const mapRes = await api.get('/campaign/map');
          if (!cancelled) setMapData(mapRes.data?.map || mapRes.data);
        } catch (e) { console.error(e); }
        
        window.history.replaceState({}, document.title); // Clean up state
        if (!cancelled) setLoading(false);
        return; 
      }

      // Normal load behavior
      try {
        const [mapRes, progRes] = await Promise.all([
          api.get('/campaign/map'),
          api.get('/campaign/progress'),
        ]);
        
        if (cancelled) return;
        setMapData(mapRes.data?.map || mapRes.data);
        setProgress(progRes.data?.progress || progRes.data);
      } catch {
        if (!cancelled) toast.error('Failed to load Campaign world');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [navigate, location.state, user]); // Added location.state and user to dependencies

  const handleNodeClick      = useCallback((node)   => setSelectedNode(node), []);
  const handleClosePanel     = useCallback(()       => setSelectedNode(null), []);
  const handleStartChallenge = useCallback((nodeId) => navigate(`/campaign/${nodeId}`), [navigate]);
  const handleProgressUpdate = useCallback((updates) => setProgress(p => ({ ...p, ...updates })), []);
  
  const handleLogout = useCallback(() => {
    localStorage.removeItem('codearena_user');
    navigate('/');
  }, [navigate]);

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-[#060810] flex flex-col items-center justify-center gap-5">
      <div className="text-6xl select-none" style={{ animation: 'bounce 1s infinite' }}>🗺️</div>
      <div className="flex items-center gap-2.5 text-slate-500 dark:text-gray-500 font-bold text-sm">
        <Loader2 size={16} className="animate-spin text-cyan-500" />
        Loading Campaign World…
      </div>
    </div>
  );

  const nodes = mapData?.nodes ?? [];

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-[#060810] flex flex-col overflow-hidden">
      <Navbar user={user} onLogout={handleLogout} />

      {/* ── HUD ── */}
      <CampaignHUD
        progress={progress}
        onOpenSkillTree={() => setShowSkillTree(true)}
      >
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

      {/* ── Map Area ── */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        <WorldMap
          nodes={nodes}
          progress={progress}
          onNodeClick={handleNodeClick}
          selectedNodeId={selectedNode?.nodeId}
        />

        {/* Mobile Backdrop Overlay - Fixed z-index */}
        {selectedNode && (
          <div
            className="sm:hidden absolute inset-0 z- bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
            onClick={handleClosePanel}
            aria-label="Close node details"
          />
        )}

        {/* Node Detail Panel - Fixed z-index and positioning */}
        {selectedNode && (
          <div className="absolute inset-y-0 right-0 z- w-full sm:w-80 md:w-96 h-full pointer-events-none">
            <div className="h-full pointer-events-auto shadow-2xl">
              <NodeDetailPanel
                node={selectedNode}
                progress={progress}
                onClose={handleClosePanel}
                onStartChallenge={handleStartChallenge}
              />
            </div>
          </div>
        )}

        {/* Empty State / Seeder Prompt */}
        {!nodes.length && !progress?.unlockedNodes?.length && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl px-4 py-3 text-center max-w-xs backdrop-blur-md shadow-lg">
              <p className="text-slate-400 text-xs mb-2">
                Showing demo map — run the seeder to enable progress saving
              </p>
              <code className="text-cyan-400 text-[11px] font-mono bg-black/40 px-2 py-1 rounded">
                node backend/seeder.js
              </code>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
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