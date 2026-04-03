// src/pages/Campaign.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Map, ArrowLeft } from 'lucide-react';
import Navbar         from '../components/Navbar';
import WorldMap       from '../components/Campaign/WorldMap';
import NodeDetailPanel from '../components/Campaign/NodeDetailPanel';
import CampaignHUD    from '../components/Campaign/CampaignHUD';
import SkillTreeModal from '../components/Campaign/SkillTreeModal';
import api            from '../api';
import toast          from 'react-hot-toast';

const Campaign = () => {
    const navigate = useNavigate();

    const [mapData,       setMapData]       = useState(null);
    const [progress,      setProgress]      = useState(null);
    const [loading,       setLoading]       = useState(true);
    const [selectedNode,  setSelectedNode]  = useState(null);
    const [showSkillTree, setShowSkillTree] = useState(false);

    const user = JSON.parse(localStorage.getItem('codearena_user') || '{}');

    useEffect(() => {
        const load = async () => {
            try {
                const [mapRes, progRes] = await Promise.all([
                    api.get('/campaign/map'),
                    api.get('/campaign/progress'),
                ]);
                setMapData(mapRes.data.map);
                setProgress(progRes.data.progress);
            } catch (err) {
                console.error('[CAMPAIGN]', err);
                toast.error('Failed to load Campaign world');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleNodeClick     = useCallback(node => setSelectedNode(node),             []);
    const handleClosePanel    = useCallback(() => setSelectedNode(null),                []);
    const handleStartChallenge = useCallback(nodeId => navigate(`/campaign/${nodeId}`), [navigate]);
    const handleProgressUpdate = useCallback(updates => setProgress(p => ({ ...p, ...updates })), []);
    const handleLogout = useCallback(() => {
        localStorage.removeItem('codearena_user');
        navigate('/');
    }, [navigate]);

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#060810] flex flex-col items-center justify-center gap-5">
                <div className="text-7xl animate-bounce select-none">🗺️</div>
                <div className="flex items-center gap-2.5 text-gray-500 font-bold">
                    <Loader2 size={18} className="animate-spin text-accent" />
                    Loading Campaign World...
                </div>
            </div>
        );
    }

    // ── Empty map (no nodes seeded yet) ─────────────────────────────────────
    if (!mapData?.nodes?.length) {
        return (
            <div className="min-h-screen bg-[#060810] flex flex-col">
                <Navbar user={user} onLogout={handleLogout} />
                <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-4">
                    <Map size={64} className="text-gray-800 opacity-50" />
                    <div>
                        <h2 className="text-2xl font-black text-gray-500 mb-2">No Campaign Nodes Yet</h2>
                        <p className="text-gray-700 text-sm">Ask an admin to seed the campaign map.</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ── Main ─────────────────────────────────────────────────────────────────
    return (
        <div className="h-screen bg-[#060810] flex flex-col overflow-hidden">
            <Navbar user={user} onLogout={handleLogout} />

            {/* Campaign HUD strip */}
            <CampaignHUD
                progress={progress}
                onOpenSkillTree={() => setShowSkillTree(true)}
            />

            {/* Map area — fills remaining height */}
            <div className="flex-1 relative overflow-hidden">
                <WorldMap
                    nodes={mapData.nodes}
                    progress={progress}
                    onNodeClick={handleNodeClick}
                    selectedNodeId={selectedNode?.nodeId}
                />

                {/* Node detail panel — slides in from right */}
                {selectedNode && (
                    <NodeDetailPanel
                        node={selectedNode}
                        progress={progress}
                        onClose={handleClosePanel}
                        onStartChallenge={handleStartChallenge}
                    />
                )}

                {/* Click-away backdrop for the panel (mobile) */}
                {selectedNode && (
                    <div
                        className="sm:hidden absolute inset-0 z-30"
                        onClick={handleClosePanel}
                        style={{ background: 'transparent' }}
                    />
                )}
            </div>

            {/* Skill Tree Modal */}
            <SkillTreeModal
                isOpen={showSkillTree}
                onClose={() => setShowSkillTree(false)}
                progress={progress}
                onProgressUpdate={handleProgressUpdate}
            />
        </div>
    );
};

export default Campaign;