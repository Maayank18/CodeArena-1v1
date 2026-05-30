import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, BookOpen } from 'lucide-react';
import Navbar from '../components/Navbar';
import WorldMap from '../components/Campaign/WorldMap';
import CampaignHUD from '../components/Campaign/CampaignHUD';
import CampaignTeaserModal from '../components/Campaign/CampaignTeaserModal';
import SkillTreeModal from '../components/Campaign/SkillTreeModal';
import CampaignGuideModal from '../components/Campaign/CampaignGuideModal';
import api from '../api';
import toast from 'react-hot-toast';
import ChatWidget from '../components/ChatWIdget';
import { useAuthSession } from '../context/AuthSessionContext.jsx';
import {
  ROOT_CAMPAIGN_NODE_ID,
  shouldLockCampaignAfterTrial,
} from '../utils/campaignAccess';

const EMPTY_MAP = { nodes: [] };
const NODE_ID_PATTERN = /node-(\d+)$/i;

const isAbsoluteRootNode = (node) =>
  node?.nodeId === ROOT_CAMPAIGN_NODE_ID ||
  (node?.regionOrder === 1 && node?.nodeOrder === 1);

const isDuplicateCancellation = (error) =>
  error?.name === 'CanceledError' ||
  error?.code === 'ERR_CANCELED' ||
  String(error?.message ?? '').includes('Duplicate');

const parseNodeOrder = (campaignNodeId, fallbackIndex = 0) => {
  const match = String(campaignNodeId ?? '').match(NODE_ID_PATTERN);
  if (match) {
    return Number(match[1]);
  }

  return fallbackIndex + 1;
};

const normalizeCampaignNodes = (rawMap) => {
  const sourceNodes = Array.isArray(rawMap)
    ? rawMap
    : Array.isArray(rawMap?.nodes)
      ? rawMap.nodes
      : [];

  return {
    nodes: sourceNodes.map((node, index) => {
      const problemData = node?.problemId ?? node?.problem ?? node;
      const fallbackTitle = node?.title || `Unknown Challenge ${index + 1}`;
      const regionOrder = Number(node?.campaignRegion) || Number(node?.regionOrder) || 1;
      const nodeId = node?.campaignNodeId || node?.nodeId || node?.id || `node_${index}`;
      const nodeOrder = Number(node?.nodeOrder) || parseNodeOrder(nodeId, index);

      return {
        ...node,
        nodeId,
        campaignNodeId: node?.campaignNodeId ?? nodeId,
        regionOrder,
        nodeOrder,
        prerequisites: Array.isArray(node?.prerequisites) ? node.prerequisites : [],
        isEntryNode: isAbsoluteRootNode({ nodeId, regionOrder, nodeOrder }),
        problem: problemData,
        problemId: problemData,
        hasProblemData: Boolean(problemData?.title),
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
  const [showTeaserModal, setShowTeaserModal] = useState(false);
  const [hasLiveMapData, setHasLiveMapData] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const { user, isHydrated, clearSession, updateSession } = useAuthSession();

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

          const mapDataArray = Array.isArray(mapRes.data?.map) ? mapRes.data.map : mapRes.data;
          const normalizedMap = normalizeCampaignNodes(mapDataArray);
          setMapData(normalizedMap);
          setHasLiveMapData(true);
          window.history.replaceState({}, document.title);
          return;
        }

        const [mapRes, progRes] = await Promise.all([
          api.get('/campaign/map'),
          api.get('/campaign/progress'),
        ]);

        if (cancelledRef.current) return;

        const mapDataArray = Array.isArray(mapRes.data?.map) ? mapRes.data.map : mapRes.data;
        const normalizedMap = normalizeCampaignNodes(mapDataArray);
        setMapData(normalizedMap);
        setProgress(progRes.data?.progress ?? progRes.data);
        setHasLiveMapData(true);
      } catch (error) {
        if (cancelledRef.current) return;

        if (isDuplicateCancellation(error)) {
          return;
        }

        console.error('[CAMPAIGN LOAD]', error);
        setMapData(EMPTY_MAP);
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
    if (!isHydrated) {
      return;
    }

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
  }, [fetchCampaignData, incomingProgress, isHydrated, navigate, user]);

  useEffect(() => {
    if (!shouldLockCampaignAfterTrial(user, progress)) {
      setShowTeaserModal(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShowTeaserModal(true);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [progress, user]);

  const handleStartChallenge = useCallback(
    (node) => {
      const targetNodeId = typeof node === 'string' ? node : node?.nodeId;
      const hasProblemData = typeof node === 'string' ? true : node?.hasProblemData !== false;
      const isValidNodeId = typeof targetNodeId === 'string' && targetNodeId.trim().length > 0;

      if (!hasProblemData || !isValidNodeId) {
        toast.error('This challenge is not available yet.');
        return;
      }

      navigate(`/campaign/${targetNodeId}`);
    },
    [navigate]
  );

  const handleTeaserTrigger = useCallback(() => {
    setShowTeaserModal(true);
  }, []);

  const handleProgressUpdate = useCallback((updates) => {
    setProgress((p) => ({ ...p, ...updates }));
  }, []);

  const handleLogout = useCallback(() => {
    clearSession({
      clearDerived: true,
      eventDetail: { redirectTo: '/', replace: true },
    });
  }, [clearSession]);

  if (!isHydrated || loading) {
    return (
      <div className="h-[100dvh] bg-slate-50 dark:bg-[#060810] flex flex-col items-center justify-center gap-5">
        <div className="text-6xl select-none" style={{ animation: 'bounce 1s infinite' }}>
          🗺️
        </div>
        <div className="flex items-center gap-2.5 text-slate-500 dark:text-gray-500 font-bold text-sm">
          <Loader2 size={16} className="animate-spin text-cyan-500" />
          Loading Campaign World...
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-[#060810] flex flex-col overflow-hidden">
      <Navbar user={user} onLogout={handleLogout} onUserUpdate={updateSession} />

      <CampaignHUD progress={progress} onOpenSkillTree={() => setShowSkillTree(true)}>
        <button
          onClick={() => setShowGuide(true)}
          className="
            flex items-center gap-1.5 px-3 py-1.5
            text-gray-600 hover:text-gray-900 hover:bg-gray-100
            dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-gray-800/60
            rounded-lg transition-all text-xs font-bold
            border border-gray-200 dark:border-transparent dark:hover:border-gray-700/40
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
          onTeaserTrigger={handleTeaserTrigger}
          useMockData={false}
        />
      </div>

      <CampaignTeaserModal isOpen={showTeaserModal} />

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

      <ChatWidget user={user} />
    </div>
  );
};

export default Campaign;
