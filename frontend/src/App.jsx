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