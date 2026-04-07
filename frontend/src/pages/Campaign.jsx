// perfect with apt responsiveness 
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, BookOpen } from 'lucide-react';
import Navbar from '../components/Navbar';
import WorldMap from '../components/Campaign/WorldMap';
import NodeDetailPanel from '../components/Campaign/NodeDetailPanel';
import CampaignHUD from '../components/Campaign/CampaignHUD';
import SkillTreeModal from '../components/Campaign/SkillTreeModal';
import CampaignGuideModal from '../components/Campaign/CampaignGuideModal';
import api from '../api';
import toast from 'react-hot-toast';

const Campaign = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mapData, setMapData] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('codearena_user') || '{}');
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    if (!user || Object.keys(user).length === 0) {
      toast.error('Please log in to access the campaign');
      navigate('/');
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);

      if (location.state?.newProgress) {
        setProgress(location.state.newProgress);

        try {
          const mapRes = await api.get('/campaign/map');
          if (!cancelled) setMapData(mapRes.data?.map ?? mapRes.data);
        } catch (e) {
          console.error('[MAP LOAD]', e);
        }

        window.history.replaceState({}, document.title);
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const [mapRes, progRes] = await Promise.all([
          api.get('/campaign/map'),
          api.get('/campaign/progress'),
        ]);

        if (cancelled) return;

        setMapData(mapRes.data?.map ?? mapRes.data);
        setProgress(progRes.data?.progress ?? progRes.data);
      } catch {
        if (!cancelled) toast.error('Failed to load Campaign world');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [navigate, location.state, user]);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleStartChallenge = useCallback(
    (nodeId) => navigate(`/campaign/${nodeId}`),
    [navigate]
  );

  const handleProgressUpdate = useCallback((updates) => {
    setProgress((p) => ({ ...p, ...updates }));
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('codearena_user');
    navigate('/');
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-[100dvh] bg-slate-50 dark:bg-[#060810] flex flex-col items-center justify-center gap-5">
        <div
          className="text-6xl select-none"
          style={{ animation: 'bounce 1s infinite' }}
        >
          🗺️
        </div>
        <div className="flex items-center gap-2.5 text-slate-500 dark:text-gray-500 font-bold text-sm">
          <Loader2 size={16} className="animate-spin text-cyan-500" />
          Loading Campaign World…
        </div>
      </div>
    );
  }

  const nodes = mapData?.nodes ?? [];

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-[#060810] flex flex-col overflow-hidden">
      <Navbar user={user} onLogout={handleLogout} />

      <CampaignHUD
        progress={progress}
        onOpenSkillTree={() => setShowSkillTree(true)}
      >
        <button
          onClick={() => setShowGuide(true)}
          className="
            flex items-center gap-1.5 px-3 py-1.5
            text-slate-500 hover:text-slate-800 hover:bg-slate-200
            dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-gray-800/60
            rounded-lg transition-colors text-xs font-bold
            border border-transparent dark:hover:border-gray-700/40
            shrink-0
          "
          title="How to Play"
        >
          <BookOpen size={14} />
          <span className="hidden sm:inline">Guide</span>
        </button>
      </CampaignHUD>

      <div className="flex-1 relative overflow-hidden min-h-0">
        <WorldMap
          nodes={nodes}
          progress={progress}
          onNodeClick={handleNodeClick}
          selectedNodeId={selectedNode?.nodeId}
        />

        {selectedNode && (
          <NodeDetailPanel
            key={selectedNode.nodeId}
            node={selectedNode}
            progress={progress}
            onClose={handleClosePanel}
            onStartChallenge={handleStartChallenge}
          />
        )}

        {!nodes.length && !progress?.unlockedNodes?.length && (
          <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-xs">
            <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl px-4 py-3 text-center backdrop-blur-md shadow-lg">
              <p className="text-slate-400 text-xs mb-2">
                Showing demo map — run the seeder to enable progress saving
              </p>
              <code className="text-cyan-400 text-[11px] font-mono bg-black/40 px-2 py-1 rounded break-all">
                node backend/seeder.js
              </code>
            </div>
          </div>
        )}
      </div>

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