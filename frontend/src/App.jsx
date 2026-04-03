import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import EditorPage from './pages/EditorPage';
import Leaderboard from './pages/Leaderboard';
import Resources from './pages/Resources';
import AdminDashboard from './pages/AdminDashboard';
import Visualizer from './pages/Visualizer'; // ✅ Import the new page
import Campaign       from './pages/Campaign';
import CampaignEditor from './pages/CampaignEditor';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Login />} /> 
            
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/resources" element={<Resources />} />
            
            {/* ✅ NEW: Top-level route for Visualizer */}
            <Route path="/visualizer" element={<Visualizer />} />
             <Route path="/campaign"          element={<Campaign />} />        
            <Route path="/campaign/:nodeId"  element={<CampaignEditor />} /> 
            
            <Route path="/editor/:roomId" element={<EditorPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
    );
}

export default App;