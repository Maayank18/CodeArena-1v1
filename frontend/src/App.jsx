import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import EditorPage from './pages/EditorPage';
import Leaderboard from './pages/Leaderboard';
import Resources from './pages/Resources';
import AdminDashboard from './pages/AdminDashboard';
import Visualizer from './pages/Visualizer';
import Campaign from './pages/Campaign';
import CampaignEditor from './pages/CampaignEditor';
import Pricing from './pages/Pricing';
import Learn from './pages/Learn';
import Contest from './pages/Contest';
import useTelemetry from './hooks/useTelemetry';
import { FrostbyteParticles, FrostbyteMountain, MatrixRainBackground, CyberpunkBackground, InfernoEmbersBackground, SamuraiLeavesBackground } from './components/advancedUI';
import { useTheme } from './context/ThemeContext';

function App() {
  const { advancedTheme } = useTheme();
  useTelemetry();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 relative overflow-x-hidden">
      {/* Frostbyte ice/snow particles — renders only when theme is active */}
      <FrostbyteParticles />
      <FrostbyteMountain />

      {advancedTheme === 'frostbyte' && (
        <>
          {/* Ambient Freezing Lens Vignette */}
          <div className="fixed inset-0 pointer-events-none z-[1] shadow-[inset_0_0_150px_rgba(6,182,212,0.15)]"></div>

          {/* Bottom-Right Ice Chunk */}
          <div 
            className="fixed -bottom-20 -right-20 w-96 h-[30rem] bg-gradient-to-tr from-[#060B19]/80 to-cyan-900/20 backdrop-blur-3xl border border-cyan-100/10 rotate-12 transform-gpu pointer-events-none z-[1] shadow-[inset_0_0_60px_rgba(255,255,255,0.05)]"
            style={{ clipPath: 'polygon(20% 0%, 100% 10%, 85% 100%, 0% 90%)' }}
          ></div>

          {/* Top-Left Ice Splinter */}
          <div 
            className="fixed -top-32 -left-10 w-72 h-80 bg-gradient-to-b from-white/5 to-cyan-500/5 backdrop-blur-2xl border-b border-r border-cyan-200/10 -rotate-12 transform-gpu pointer-events-none z-[1] shadow-[inset_0_0_30px_rgba(34,211,238,0.1)]"
            style={{ clipPath: 'polygon(0% 0%, 80% 0%, 40% 100%, 10% 80%)' }}
          ></div>
        </>
      )}

      {/* Matrix rain - renders only when theme is active */}
      {advancedTheme === 'matrix' && (
        <MatrixRainBackground forceActive={true} />
      )}

      {/* Cyberpunk background - renders only when theme is active */}
      {advancedTheme === 'cyberpunk' && (
        <CyberpunkBackground forceActive={true} />
      )}

      {/* Inferno background - renders only when theme is active */}
      {advancedTheme === 'inferno' && (
        <InfernoEmbersBackground forceActive={true} />
      )}

      {/* Samurai background - renders only when theme is active */}
      {advancedTheme === 'samurai' && (
        <SamuraiLeavesBackground forceActive={true} />
      )}

      {/* Main Content Layer (Z-Index fix for particles) */}
      <div className="relative z-10 w-full h-full flex flex-col min-h-screen">
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
      </div>
    </div>
  );
}

export default App;
