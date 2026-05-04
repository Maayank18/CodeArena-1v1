import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, BookOpen } from 'lucide-react';
import Navbar from '../components/Navbar';
import WorldMap from '../components/Campaign/WorldMap';
import CampaignHUD from '../components/Campaign/CampaignHUD';
import SkillTreeModal from '../components/Campaign/SkillTreeModal';
import CampaignGuideModal from '../components/Campaign/CampaignGuideModal';
import api from '../api';
import toast from 'react-hot-toast';

const EMPTY_MAP = { nodes: [] };
const DEMO_MODE_TOAST = 'Challenge not available in demo mode. Please run the local seeder.';
const ROOT_NODE_ID = 'aa_01';

const isAbsoluteRootNode = (node) =>
  node?.nodeId === ROOT_NODE_ID ||
  (node?.regionOrder === 1 && node?.nodeOrder === 1);

const normalizeCampaignNodes = (rawMap) => {
  const sourceNodes = Array.isArray(rawMap?.nodes)
    ? rawMap.nodes
    : Array.isArray(rawMap)
      ? rawMap
      : [];

  return {
    ...(rawMap && typeof rawMap === 'object' && !Array.isArray(rawMap) ? rawMap : {}),
    nodes: sourceNodes.map((node, index) => {
      const problemData = node?.problemId ?? node?.problem ?? null;
      const fallbackTitle = node?.title || `Unknown Challenge ${index + 1}`;

      return {
        ...node,
        prerequisites: Array.isArray(node?.prerequisites) ? node.prerequisites : [],
        isEntryNode: isAbsoluteRootNode(node),
        problem: problemData,
        problemId: problemData,
        hasProblemData: Boolean(problemData),
        title: problemData?.title || fallbackTitle,
        difficulty: problemData?.difficulty || 'Easy',
        slug: problemData?.slug || null,
      };
    }),
  };
};

const Campaign = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mapData, setMapData] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLiveMapData, setHasLiveMapData] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('codearena_user') || '{}');
    } catch {
      return {};
    }
  });

  const incomingProgress = location.state?.newProgress ?? null;
  const nodes = useMemo(() => mapData?.nodes ?? [], [mapData]);

  const fetchCampaignData = useCallback(
    async (progressOverride = null, cancelledRef = { current: false }) => {
      setLoading(true);

      try {
        if (progressOverride) {
          setProgress(progressOverride);
          const mapRes = await api.get('/campaign/map');

          if (cancelledRef.current) return;

          const normalizedMap = normalizeCampaignNodes(mapRes.data?.map ?? mapRes.data);
          setMapData(normalizedMap.nodes.length ? normalizedMap : EMPTY_MAP);
          setHasLiveMapData(true);
          window.history.replaceState({}, document.title);
          return;
        }

        const [mapRes, progRes] = await Promise.all([
          api.get('/campaign/map'),
          api.get('/campaign/progress'),
        ]);

        if (cancelledRef.current) return;

        const normalizedMap = normalizeCampaignNodes(mapRes.data?.map ?? mapRes.data);
        setMapData(normalizedMap.nodes.length ? normalizedMap : EMPTY_MAP);
        setProgress(progRes.data?.progress ?? progRes.data);
        setHasLiveMapData(true);
      } catch (error) {
        if (cancelledRef.current) return;

        console.error('[CAMPAIGN LOAD]', error);
        setHasLiveMapData(false);
        toast.error('Failed to load Campaign world');
      } finally {
        if (!cancelledRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!user || Object.keys(user).length === 0) {
      toast.error('Please log in to access the campaign');
      navigate('/');
      return;
    }

    const cancelledRef = { current: false };

    fetchCampaignData(incomingProgress, cancelledRef);

    return () => {
      cancelledRef.current = true;
    };
  }, [fetchCampaignData, incomingProgress, navigate, user]);

  const handleStartChallenge = useCallback(
    (node) => {
      const targetNodeId = typeof node === 'string' ? node : node?.nodeId;
      const hasProblemData = typeof node === 'string' ? true : node?.hasProblemData !== false;
      const isValidNodeId = typeof targetNodeId === 'string' && targetNodeId.trim().length > 0;

      if (!hasLiveMapData) {
        toast.error(DEMO_MODE_TOAST);
        return;
      }

      if (!hasProblemData || !isValidNodeId) {
        toast.error('This challenge is not available yet.');
        return;
      }

      navigate(`/campaign/${targetNodeId}`);
    },
    [hasLiveMapData, navigate]
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

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-[#060810] flex flex-col overflow-hidden">
      <Navbar user={user} onLogout={handleLogout} onUserUpdate={setUser} />

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
          onStartChallenge={handleStartChallenge}
          useMockData={!hasLiveMapData}
        />

        {!hasLiveMapData && !nodes.length && !progress?.unlockedNodes?.length && (
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
// V 1.5
