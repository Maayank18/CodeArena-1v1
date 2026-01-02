// import { Routes, Route } from 'react-router-dom';
// import Landing from './pages/Landing';
// import Login from './pages/Login';
// import Dashboard from './pages/Dashboard';
// import History from './pages/History';
// import EditorPage from './pages/EditorPage';
// import Leaderboard from './pages/Leaderboard';
// import Resources from './pages/Resources';

// function App() {
//   return (
//     <Routes>
//       <Route path="/" element={<Landing />} />
//       <Route path="/login" element={<Login />} />
//       {/* Reusing Login component is fine, the component handles the toggle state internally */}
//       <Route path="/signup" element={<Login />} /> 
//       <Route path="/dashboard" element={<Dashboard />} />
//       <Route path="/history" element={<History />} />
//       <Route path="/leaderboard" element={<Leaderboard />} />
//       <Route path="/resources" element={<Resources />} />
//       <Route path="/editor/:roomId" element={<EditorPage />} />
//     </Routes>
//   );
// }

// export default App;




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

function App() {
    // useEffect(() => {
    //     /**
    //      * ✅ SENIOR DEVELOPER OPTIMIZATION: GLOBAL WAKE-UP
    //      * This fires a lightweight request to the backend immediately.
    //      * By the time the user logs in or reaches the dashboard, the 
    //      * Render "Cold Start" (8-15s) will already be completed.
    //      */
    //     const wakeUpServer = async () => {
    //         const API_URL = import.meta.env.VITE_API_URL || 'https://codearena-1v1.onrender.com';
    //         try {
    //             // We target the light health-check route to minimize server load
    //             await axios.get(`${API_URL.replace(/\/$/, '')}/api/health`);
    //             console.log("🚀 CodeArena Backend: Warm-up signal sent successfully.");
    //         } catch (error) {
    //             // If it fails (e.g., server still booting), the request itself 
    //             // has already triggered the Render "Spin Up" process.
    //             console.log("⏳ CodeArena Backend: Spinning up server...");
    //         }
    //     };

    //     wakeUpServer();
    // }, []);

    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            {/* Login handles toggle state internally for signup */}
            <Route path="/signup" element={<Login />} /> 
            
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/editor/:roomId" element={<EditorPage />} />
        </Routes>
    );
}

export default App;