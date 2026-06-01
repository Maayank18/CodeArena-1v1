import React, { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import {
  CyberpunkBackground,
  FrostbyteMountain,
  FrostbyteParticles,
  InfernoEmbersBackground,
  MatrixRainBackground,
  SamuraiLeavesBackground,
} from './components/advancedUI';
import { useTheme } from './context/ThemeContext';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const History = lazy(() => import('./pages/History'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Resources = lazy(() => import('./pages/Resources'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Visualizer = lazy(() => import('./pages/Visualizer'));
const Campaign = lazy(() => import('./pages/Campaign'));
const CampaignEditor = lazy(() => import('./pages/CampaignEditor'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Learn = lazy(() => import('./pages/Learn'));
const Contest = lazy(() => import('./pages/Contest'));

const RouteLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border-color)] border-t-accent" />
  </div>
);

function App() {
  const { advancedTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 relative overflow-x-hidden">
      {advancedTheme === 'frostbyte' && (
        <>
          <FrostbyteParticles />
          <FrostbyteMountain />
          <div className="fixed inset-0 pointer-events-none z-[1] shadow-[inset_0_0_150px_rgba(6,182,212,0.15)]" />
          <div
            className="fixed -bottom-20 -right-20 w-96 h-[30rem] bg-gradient-to-tr from-[#060B19]/80 to-cyan-900/20 backdrop-blur-3xl border border-cyan-100/10 rotate-12 transform-gpu pointer-events-none z-[1] shadow-[inset_0_0_60px_rgba(255,255,255,0.05)]"
            style={{ clipPath: 'polygon(20% 0%, 100% 10%, 85% 100%, 0% 90%)' }}
          />
          <div
            className="fixed -top-32 -left-10 w-72 h-80 bg-gradient-to-b from-white/5 to-cyan-500/5 backdrop-blur-2xl border-b border-r border-cyan-200/10 -rotate-12 transform-gpu pointer-events-none z-[1] shadow-[inset_0_0_30px_rgba(34,211,238,0.1)]"
            style={{ clipPath: 'polygon(0% 0%, 80% 0%, 40% 100%, 10% 80%)' }}
          />
        </>
      )}

      {advancedTheme === 'matrix' && (
        <MatrixRainBackground forceActive={true} />
      )}

      {advancedTheme === 'cyberpunk' && (
        <CyberpunkBackground forceActive={true} />
      )}

      {advancedTheme === 'inferno' && (
        <InfernoEmbersBackground forceActive={true} />
      )}

      {advancedTheme === 'samurai' && (
        <SamuraiLeavesBackground forceActive={true} />
      )}

      <div className="relative z-10 w-full h-full flex flex-col min-h-screen">
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Login />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/visualizer" element={<Visualizer />} />
            <Route path="/campaign" element={<Campaign />} />
            <Route path="/campaign/:nodeId" element={<CampaignEditor />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/contest" element={<Contest />} />
            <Route path="/editor/:roomId" element={<EditorPage />} />
            <Route path="/settings" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default App;

// Version-2.0