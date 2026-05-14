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

function App() {
  useTelemetry();

  return (
    <>
      {/* Legacy Bright Theme Wrapper (for quick reversal): <div className="min-h-screen bg-white text-black"> */}
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
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
    </>
  );
}

export default App;
