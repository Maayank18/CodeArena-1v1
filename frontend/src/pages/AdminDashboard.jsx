// // ========================================================================
// // FILE: frontend/src/pages/AdminDashboard.jsx
// // COMPLETE ENHANCED VERSION WITH ALL FIXES
// // ========================================================================

// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//     Users, Trophy, TrendingUp, Activity, Clock, AlertTriangle,
//     RefreshCw, Trash2, Edit, Search, BarChart, Shield, LogOut,
//     Code, Plus, X, Eye, EyeOff, Save, ChevronDown, ChevronUp,
//     CheckCircle, XCircle, Zap, Database, Calendar, Filter
// } from 'lucide-react';
// import api from '../api';
// import toast from 'react-hot-toast';

// const AdminDashboard = () => {
//     const [user, setUser] = useState(null);
//     const [stats, setStats] = useState(null);
//     const [users, setUsers] = useState([]);
//     const [problems, setProblems] = useState([]);
//     const [recentActivity, setRecentActivity] = useState({ matches: [], users: [] });
//     const [hourlyActivity, setHourlyActivity] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [activeTab, setActiveTab] = useState('overview');
//     const [searchQuery, setSearchQuery] = useState('');
//     const [showAddProblem, setShowAddProblem] = useState(false);
//     const [editingProblem, setEditingProblem] = useState(null);
//     const [filterDifficulty, setFilterDifficulty] = useState('all');
    
//     const navigate = useNavigate();

//     // ===== AUTH CHECK =====
//     useEffect(() => {
//         const storedUser = JSON.parse(localStorage.getItem('codearena_user'));
//         if (!storedUser) {
//             navigate('/login');
//             return;
//         }

//         const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
//         if (storedUser.username !== adminUsername) {
//             toast.error('Access Denied: Admin privileges required');
//             navigate('/dashboard');
//             return;
//         }

//         setUser(storedUser);
//         fetchDashboardData(storedUser.username);
//     }, [navigate]);

//     // ===== FETCH DATA =====
//     const fetchDashboardData = async (username) => {
//         setLoading(true);
//         try {
//             const [statsRes, usersRes, activityRes, hourlyRes, problemsRes] = await Promise.all([
//                 api.post('/admin/stats', { username }),
//                 api.post('/admin/users', { username, limit: 100 }),
//                 api.post('/admin/activity/recent', { username }),
//                 api.post('/admin/activity/hourly', { username }),
//                 api.post('/admin/problems', { username })
//             ]);

//             setStats(statsRes.data);
//             setUsers(usersRes.data.users);
//             setRecentActivity(activityRes.data);
//             setHourlyActivity(hourlyRes.data.hourlyActivity);
//             setProblems(problemsRes.data.problems);

//         } catch (error) {
//             console.error('Failed to fetch admin data:', error);
//             toast.error('Failed to load admin data');
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ===== LEADERBOARD ACTIONS =====
//     const handleResetSeason = async () => {
//         if (!confirm('⚠️ Reset ALL season scores to 0? This cannot be undone!')) return;

//         try {
//             const res = await api.post('/admin/leaderboard/reset-season', { 
//                 username: user.username 
//             });
//             toast.success(res.data.message);
//             fetchDashboardData(user.username);
//         } catch (error) {
//             toast.error('Failed to reset season scores');
//         }
//     };

//     const handleResetAll = async () => {
//         if (!confirm('⚠️⚠️ RESET ALL STATS (ELO, Season, Wins, Losses)? This CANNOT be undone!')) return;
//         if (!confirm('Are you ABSOLUTELY sure? Type YES in your mind and click OK')) return;

//         try {
//             const res = await api.post('/admin/leaderboard/reset-all', { 
//                 username: user.username 
//             });
//             toast.success(res.data.message);
//             fetchDashboardData(user.username);
//         } catch (error) {
//             toast.error('Failed to reset all stats');
//         }
//     };

//     const handleClearMatches = async () => {
//         if (!confirm('⚠️ Delete ALL match history? This cannot be undone!')) return;

//         try {
//             const res = await api.post('/admin/matches/clear', { 
//                 username: user.username 
//             });
//             toast.success(res.data.message);
//             fetchDashboardData(user.username);
//         } catch (error) {
//             toast.error('Failed to clear match history');
//         }
//     };

//     // ===== USER ACTIONS =====
//     const handleDeleteUser = async (userId, username) => {
//         if (!confirm(`Delete user "${username}" and all their matches?`)) return;

//         try {
//             await api.post(`/admin/users/${userId}/delete`, { 
//                 username: user.username 
//             });
//             toast.success('User deleted successfully');
//             fetchDashboardData(user.username);
//         } catch (error) {
//             toast.error('Failed to delete user');
//         }
//     };

//     // ===== PROBLEM ACTIONS =====
//     const handleDeleteProblem = async (problemId, title) => {
//         if (!confirm(`Delete problem "${title}"? This will affect ongoing matches!`)) return;

//         try {
//             await api.post(`/admin/problems/${problemId}/delete`, { 
//                 username: user.username 
//             });
//             toast.success('Problem deleted successfully');
//             fetchDashboardData(user.username);
//         } catch (error) {
//             toast.error('Failed to delete problem');
//         }
//     };

//     const handleEditProblem = (problem) => {
//         setEditingProblem(problem);
//     };

//     // ===== FILTERING =====
//     const filteredUsers = users.filter(u =>
//         u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         u.email?.toLowerCase().includes(searchQuery.toLowerCase())
//     );

//     const filteredProblems = problems.filter(p => {
//         const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//             p.slug.toLowerCase().includes(searchQuery.toLowerCase());
//         const matchesDifficulty = filterDifficulty === 'all' || p.difficulty === filterDifficulty;
//         return matchesSearch && matchesDifficulty;
//     });

//     // ===== RENDER =====
//     if (loading) {
//         return (
//             <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
//                 <div className="text-center">
//                     <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent mx-auto mb-4"></div>
//                     <p className="text-gray-400 text-lg">Loading Admin Control Panel...</p>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen bg-[#0a0a0a] text-white">
//             {/* HEADER */}
//             <div className="bg-gradient-to-r from-[#111] to-[#1a1a1a] border-b border-gray-800 sticky top-0 z-50 backdrop-blur-lg bg-opacity-95 shadow-2xl">
//                 <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
//                     <div className="flex items-center gap-4">
//                         <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 flex items-center justify-center shadow-lg">
//                             <Shield size={28} className="text-white" />
//                         </div>
//                         <div>
//                             <h1 className="text-2xl font-black bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
//                                 Admin Control Center
//                             </h1>
//                             <p className="text-sm text-gray-400 flex items-center gap-2">
//                                 <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
//                                 Logged in as <span className="font-bold text-accent">{user?.username}</span>
//                             </p>
//                         </div>
//                     </div>
//                     <div className="flex items-center gap-3">
//                         <button
//                             onClick={() => fetchDashboardData(user.username)}
//                             className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all hover:scale-105"
//                         >
//                             <RefreshCw size={18} />
//                             Refresh
//                         </button>
//                         <button
//                             onClick={() => navigate('/dashboard')}
//                             className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 rounded-lg hover:from-red-500 hover:to-red-400 transition-all hover:scale-105 font-bold"
//                         >
//                             <LogOut size={18} />
//                             Exit Admin
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             {/* TABS */}
//             <div className="bg-[#111] border-b border-gray-800 sticky top-[73px] z-40 backdrop-blur-lg bg-opacity-95">
//                 <div className="max-w-7xl mx-auto px-4">
//                     <div className="flex gap-1 overflow-x-auto scrollbar-hide">
//                         {[
//                             { id: 'overview', icon: Activity, label: 'Overview' },
//                             { id: 'users', icon: Users, label: 'Users' },
//                             { id: 'problems', icon: Code, label: 'Problems' },
//                             { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
//                             { id: 'analytics', icon: BarChart, label: 'Analytics' }
//                         ].map(tab => (
//                             <button
//                                 key={tab.id}
//                                 onClick={() => setActiveTab(tab.id)}
//                                 className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
//                                     activeTab === tab.id
//                                         ? 'border-accent text-accent bg-accent/10'
//                                         : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
//                                 }`}
//                             >
//                                 <tab.icon size={18} />
//                                 {tab.label}
//                             </button>
//                         ))}
//                     </div>
//                 </div>
//             </div>

//             {/* CONTENT */}
//             <div className="max-w-7xl mx-auto p-6 space-y-6">
                
//                 {/* ===== OVERVIEW TAB ===== */}
//                 {activeTab === 'overview' && (
//                     <>
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                             <StatCard
//                                 icon={<Users className="text-blue-400" size={28} />}
//                                 title="Total Users"
//                                 value={stats?.users.total || 0}
//                                 subtitle={`+${stats?.users.newToday || 0} today`}
//                                 trend="+12%"
//                                 color="blue"
//                             />
//                             <StatCard
//                                 icon={<Trophy className="text-yellow-400" size={28} />}
//                                 title="Total Matches"
//                                 value={stats?.matches.total || 0}
//                                 subtitle={`+${stats?.matches.today || 0} today`}
//                                 trend="+8%"
//                                 color="yellow"
//                             />
//                             <StatCard
//                                 icon={<TrendingUp className="text-green-400" size={28} />}
//                                 title="Avg Matches/User"
//                                 value={(stats?.matches.avgPerUser || 0).toFixed(1)}
//                                 subtitle="per user"
//                                 trend="+5%"
//                                 color="green"
//                             />
//                             <StatCard
//                                 icon={<Zap className="text-purple-400" size={28} />}
//                                 title="Most Active"
//                                 value={stats?.players.mostActive?.username || 'N/A'}
//                                 subtitle={`${stats?.players.mostActive?.stats?.matchesPlayed || 0} matches`}
//                                 color="purple"
//                             />
//                         </div>

//                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                             {/* Recent Matches */}
//                             <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6 shadow-xl">
//                                 <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
//                                     <Clock className="text-accent" size={24} />
//                                     Recent Matches
//                                     <span className="ml-auto text-sm font-normal text-gray-500">
//                                         Last 10
//                                     </span>
//                                 </h3>
//                                 <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
//                                     {recentActivity.matches.slice(0, 10).map((match, idx) => (
//                                         <div key={idx} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg hover:bg-gray-900 transition-all border border-gray-900 hover:border-gray-800 group">
//                                             <div className="flex-1">
//                                                 <div className="font-mono text-sm flex items-center gap-2">
//                                                     <span className="font-bold text-white group-hover:text-accent transition-colors">
//                                                         {match.players[0]?.username}
//                                                     </span>
//                                                     <span className="text-gray-600">vs</span>
//                                                     <span className="font-bold text-white group-hover:text-accent transition-colors">
//                                                         {match.players[1]?.username}
//                                                     </span>
//                                                 </div>
//                                                 <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
//                                                     <Trophy size={12} className="text-yellow-500" />
//                                                     Winner: <span className="text-accent font-bold">{match.winner}</span>
//                                                 </div>
//                                             </div>
//                                             <div className="text-xs text-gray-500 flex flex-col items-end gap-1">
//                                                 <Calendar size={12} className="inline mr-1" />
//                                                 {new Date(match.createdAt).toLocaleDateString()}
//                                                 <Clock size={12} className="inline mr-1" />
//                                                 {new Date(match.createdAt).toLocaleTimeString()}
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>

//                             {/* Recent Users */}
//                             <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6 shadow-xl">
//                                 <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
//                                     <Users className="text-blue-400" size={24} />
//                                     New Users
//                                     <span className="ml-auto text-sm font-normal text-gray-500">
//                                         Last 10
//                                     </span>
//                                 </h3>
//                                 <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
//                                     {recentActivity.users.slice(0, 10).map((u, idx) => (
//                                         <div key={idx} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg hover:bg-gray-900 transition-all border border-gray-900 hover:border-gray-800 group">
//                                             <div className="flex items-center gap-3">
//                                                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-green-400 flex items-center justify-center font-bold text-black">
//                                                     {u.username[0].toUpperCase()}
//                                                 </div>
//                                                 <div>
//                                                     <div className="font-bold group-hover:text-accent transition-colors">
//                                                         {u.username}
//                                                     </div>
//                                                     <div className="text-xs text-gray-500">{u.email}</div>
//                                                 </div>
//                                             </div>
//                                             <div className="text-xs text-gray-500 text-right">
//                                                 <div className="flex items-center gap-1">
//                                                     <Calendar size={12} />
//                                                     {new Date(u.createdAt).toLocaleDateString()}
//                                                 </div>
//                                                 <div className="flex items-center gap-1 mt-1">
//                                                     <Clock size={12} />
//                                                     {new Date(u.createdAt).toLocaleTimeString()}
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         </div>
//                     </>
//                 )}

//                 {/* ===== USERS TAB ===== */}
//                 {activeTab === 'users' && (
//                     <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6 shadow-xl">
//                         <div className="flex items-center justify-between mb-6">
//                             <h3 className="text-2xl font-bold flex items-center gap-2">
//                                 <Users className="text-blue-400" />
//                                 User Management
//                                 <span className="text-sm font-normal text-gray-500 ml-2">
//                                     ({filteredUsers.length} users)
//                                 </span>
//                             </h3>
//                             <div className="relative">
//                                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                                 <input
//                                     type="text"
//                                     placeholder="Search users..."
//                                     value={searchQuery}
//                                     onChange={(e) => setSearchQuery(e.target.value)}
//                                     className="pl-10 pr-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent w-80"
//                                 />
//                             </div>
//                         </div>

//                         <div className="overflow-x-auto rounded-lg border border-gray-800">
//                             <table className="w-full">
//                                 <thead className="bg-[#0a0a0a]">
//                                     <tr className="border-b border-gray-800">
//                                         <th className="text-left p-4 text-xs font-bold uppercase text-gray-400">User</th>
//                                         <th className="text-left p-4 text-xs font-bold uppercase text-gray-400">Rating</th>
//                                         <th className="text-left p-4 text-xs font-bold uppercase text-gray-400">Season</th>
//                                         <th className="text-left p-4 text-xs font-bold uppercase text-gray-400">W/L</th>
//                                         <th className="text-left p-4 text-xs font-bold uppercase text-gray-400">Matches</th>
//                                         <th className="text-left p-4 text-xs font-bold uppercase text-gray-400">Joined</th>
//                                         <th className="text-right p-4 text-xs font-bold uppercase text-gray-400">Actions</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {filteredUsers.map((u, idx) => (
//                                         <tr key={u._id} className={`border-b border-gray-900 hover:bg-gray-900/50 transition-all ${idx % 2 === 0 ? 'bg-[#0a0a0a]/50' : ''}`}>
//                                             <td className="p-4">
//                                                 <div className="flex items-center gap-3">
//                                                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-green-400 flex items-center justify-center font-bold text-black">
//                                                         {u.username[0].toUpperCase()}
//                                                     </div>
//                                                     <div>
//                                                         <div className="font-bold">{u.username}</div>
//                                                         <div className="text-xs text-gray-500">{u.email}</div>
//                                                     </div>
//                                                 </div>
//                                             </td>
//                                             <td className="p-4">
//                                                 <span className="font-mono font-bold text-yellow-400">
//                                                     {u.rating || 1000}
//                                                 </span>
//                                             </td>
//                                             <td className="p-4">
//                                                 <span className="font-mono font-bold text-green-400">
//                                                     {u.seasonScore || 0}
//                                                 </span>
//                                             </td>
//                                             <td className="p-4">
//                                                 <div className="flex items-center gap-2">
//                                                     <span className="text-green-400 font-bold">{u.stats?.wins || 0}</span>
//                                                     <span className="text-gray-600">/</span>
//                                                     <span className="text-red-400 font-bold">{u.stats?.losses || 0}</span>
//                                                 </div>
//                                             </td>
//                                             <td className="p-4">
//                                                 <span className="font-mono">{u.stats?.matchesPlayed || 0}</span>
//                                             </td>
//                                             <td className="p-4 text-sm text-gray-500">
//                                                 {new Date(u.createdAt).toLocaleDateString()}
//                                             </td>
//                                             <td className="p-4 text-right">
//                                                 <button
//                                                     onClick={() => handleDeleteUser(u._id, u.username)}
//                                                     className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all inline-flex items-center gap-2"
//                                                 >
//                                                     <Trash2 size={16} />
//                                                     Delete
//                                                 </button>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>
//                 )}

//                 {/* ===== PROBLEMS TAB ===== */}
//                 {activeTab === 'problems' && (
//                     <div className="space-y-4">
//                         <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6 shadow-xl">
//                             <div className="flex items-center justify-between mb-6">
//                                 <h3 className="text-2xl font-bold flex items-center gap-2">
//                                     <Code className="text-accent" size={28} />
//                                     Problem Management
//                                     <span className="text-sm font-normal text-gray-500 ml-2">
//                                         ({filteredProblems.length} problems)
//                                     </span>
//                                 </h3>
//                                 <button
//                                     onClick={() => setShowAddProblem(true)}
//                                     className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-green-400 text-black rounded-lg hover:from-green-400 hover:to-accent transition-all font-bold shadow-lg hover:shadow-accent/50 hover:scale-105"
//                                 >
//                                     <Plus size={20} />
//                                     Add Problem
//                                 </button>
//                             </div>

//                             <div className="flex gap-4 mb-6">
//                                 <div className="relative flex-1">
//                                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                                     <input
//                                         type="text"
//                                         placeholder="Search problems..."
//                                         value={searchQuery}
//                                         onChange={(e) => setSearchQuery(e.target.value)}
//                                         className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent"
//                                     />
//                                 </div>
//                                 <div className="relative">
//                                     <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                                     <select
//                                         value={filterDifficulty}
//                                         onChange={(e) => setFilterDifficulty(e.target.value)}
//                                         className="pl-10 pr-8 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent appearance-none cursor-pointer"
//                                     >
//                                         <option value="all">All Difficulties</option>
//                                         <option value="Easy">Easy</option>
//                                         <option value="Medium">Medium</option>
//                                         <option value="Hard">Hard</option>
//                                     </select>
//                                 </div>
//                             </div>

//                             <div className="space-y-3">
//                                 {filteredProblems.map((p) => (
//                                     <ProblemCard
//                                         key={p._id}
//                                         problem={p}
//                                         onEdit={() => handleEditProblem(p)}
//                                         onDelete={() => handleDeleteProblem(p._id, p.title)}
//                                     />
//                                 ))}
//                                 {filteredProblems.length === 0 && (
//                                     <div className="text-center py-12 text-gray-500">
//                                         <Code size={48} className="mx-auto mb-4 opacity-50" />
//                                         <p className="text-lg">No problems found</p>
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* ===== LEADERBOARD TAB ===== */}
//                 {activeTab === 'leaderboard' && (
//                     <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6 shadow-xl">
//                         <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
//                             <Trophy className="text-yellow-400" />
//                             Leaderboard Management
//                         </h3>
                        
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                             <ActionCard
//                                 icon={<RefreshCw className="text-orange-400" size={32} />}
//                                 title="Reset Season Scores"
//                                 description="Set all seasonScore to 0 (keeps ELO & stats intact)"
//                                 onClick={handleResetSeason}
//                                 color="orange"
//                                 severity="medium"
//                             />
//                             <ActionCard
//                                 icon={<AlertTriangle className="text-red-400" size={32} />}
//                                 title="Reset All Stats"
//                                 description="Reset ELO, season, wins, losses (⚠️ Irreversible!)"
//                                 onClick={handleResetAll}
//                                 color="red"
//                                 severity="high"
//                             />
//                             <ActionCard
//                                 icon={<Trash2 className="text-purple-400" size={32} />}
//                                 title="Clear Match History"
//                                 description="Delete all match records (⚠️ Irreversible!)"
//                                 onClick={handleClearMatches}
//                                 color="purple"
//                                 severity="high"
//                             />
//                         </div>
//                     </div>
//                 )}

//                 {/* ===== ANALYTICS TAB ===== */}
//                 {activeTab === 'analytics' && (
//                     <div className="space-y-6">
//                         <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6 shadow-xl">
//                             <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
//                                 <BarChart className="text-accent" />
//                                 Activity by Hour
//                                 <span className="text-sm font-normal text-gray-500 ml-2">
//                                     (Total Matches: {hourlyActivity.reduce((a, b) => a + b, 0)})
//                                 </span>
//                             </h3>
//                             <div className="flex items-end justify-between gap-2 h-80">
//                                 {hourlyActivity.map((count, hour) => {
//                                     const maxCount = Math.max(...hourlyActivity, 1);
//                                     const height = (count / maxCount) * 100;
//                                     return (
//                                         <div key={hour} className="flex-1 flex flex-col items-center justify-end group">
//                                             <div className="relative w-full">
//                                                 <div
//                                                     className="w-full bg-gradient-to-t from-accent to-green-400 rounded-t transition-all hover:from-green-400 hover:to-accent cursor-pointer"
//                                                     style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
//                                                 >
//                                                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
//                                                         {count} matches
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                             <div className="text-[10px] mt-2 text-gray-500 group-hover:text-accent transition-colors font-mono">
//                                                 {hour.toString().padStart(2, '0')}:00
//                                             </div>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         </div>

//                         {/* Additional Stats */}
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                             <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6">
//                                 <div className="flex items-center gap-3 mb-4">
//                                     <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
//                                         <Database className="text-blue-400" size={24} />
//                                     </div>
//                                     <div>
//                                         <div className="text-sm text-gray-500">Total Problems</div>
//                                         <div className="text-2xl font-bold">{problems.length}</div>
//                                     </div>
//                                 </div>
//                                 <div className="space-y-2">
//                                     <div className="flex justify-between text-sm">
//                                         <span className="text-green-400">Easy</span>
//                                         <span className="font-bold">{problems.filter(p => p.difficulty === 'Easy').length}</span>
//                                     </div>
//                                     <div className="flex justify-between text-sm">
//                                         <span className="text-yellow-400">Medium</span>
//                                         <span className="font-bold">{problems.filter(p => p.difficulty === 'Medium').length}</span>
//                                     </div>
//                                     <div className="flex justify-between text-sm">
//                                         <span className="text-red-400">Hard</span>
//                                         <span className="font-bold">{problems.filter(p => p.difficulty === 'Hard').length}</span>
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6">
//                                 <div className="flex items-center gap-3 mb-4">
//                                     <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
//                                         <CheckCircle className="text-green-400" size={24} />
//                                     </div>
//                                     <div>
//                                         <div className="text-sm text-gray-500">Active Users</div>
//                                         <div className="text-2xl font-bold">
//                                             {users.filter(u => u.stats?.matchesPlayed > 0).length}
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <div className="text-sm text-gray-500">
//                                     {((users.filter(u => u.stats?.matchesPlayed > 0).length / users.length) * 100 || 0).toFixed(1)}% of total users
//                                 </div>
//                             </div>

//                             <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6">
//                                 <div className="flex items-center gap-3 mb-4">
//                                     <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
//                                         <Activity className="text-purple-400" size={24} />
//                                     </div>
//                                     <div>
//                                         <div className="text-sm text-gray-500">Peak Hour</div>
//                                         <div className="text-2xl font-bold">
//                                             {hourlyActivity.indexOf(Math.max(...hourlyActivity))}:00
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <div className="text-sm text-gray-500">
//                                     {Math.max(...hourlyActivity)} matches
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>

//             {/* MODALS */}
//             {showAddProblem && (
//                 <ProblemModal
//                     onClose={() => setShowAddProblem(false)}
//                     onSuccess={() => {
//                         setShowAddProblem(false);
//                         fetchDashboardData(user.username);
//                     }}
//                     username={user.username}
//                 />
//             )}

//             {editingProblem && (
//                 <ProblemModal
//                     problem={editingProblem}
//                     onClose={() => setEditingProblem(null)}
//                     onSuccess={() => {
//                         setEditingProblem(null);
//                         fetchDashboardData(user.username);
//                     }}
//                     username={user.username}
//                 />
//             )}
//         </div>
//     );
// };

// // ===== UTILITY COMPONENTS =====

// const StatCard = ({ icon, title, value, subtitle, trend, color }) => (
//     <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-all hover:scale-105 shadow-lg">
//         <div className="flex items-center justify-between mb-3">
//             <div className={`p-3 rounded-xl bg-${color}-500/20`}>
//                 {icon}
//             </div>
//             {trend && (
//                 <span className="text-xs font-bold text-green-400 flex items-center gap-1">
//                     <TrendingUp size={12} />
//                     {trend}
//                 </span>
//             )}
//         </div>
//         <div className="text-sm text-gray-500 mb-1">{title}</div>
//         <div className="text-3xl font-black mb-1">{value}</div>
//         <div className="text-sm text-gray-500">{subtitle}</div>
//     </div>
// );

// const ActionCard = ({ icon, title, description, onClick, color, severity }) => (
//     <button
//         onClick={onClick}
//         className={`p-6 bg-${color}-500/10 border-2 border-${color}-500/20 rounded-xl hover:border-${color}-500 transition-all text-left group hover:scale-105 relative overflow-hidden`}
//     >
//         {severity === 'high' && (
//             <div className="absolute top-2 right-2">
//                 <AlertTriangle size={16} className="text-red-400 animate-pulse" />
//             </div>
//         )}
//         <div className="mb-4 group-hover:scale-110 transition-transform">{icon}</div>
//         <div className="font-bold text-lg mb-2 group-hover:text-white transition-colors">{title}</div>
//         <div className="text-sm text-gray-400 leading-relaxed">{description}</div>
//     </button>
// );

// const ProblemCard = ({ problem, onEdit, onDelete }) => {
//     const [expanded, setExpanded] = useState(false);

//     return (
//         <div className="bg-[#0a0a0a] rounded-lg border border-gray-900 hover:border-gray-800 transition-all group overflow-hidden">
//             <div className="flex items-center justify-between p-5">
//                 <div className="flex-1">
//                     <div className="flex items-center gap-3 mb-2">
//                         <h4 className="font-bold text-lg group-hover:text-accent transition-colors">
//                             {problem.title}
//                         </h4>
//                         <span className={`text-xs px-3 py-1 rounded-full font-bold ${
//                             problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
//                             problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
//                             'bg-red-500/20 text-red-400'
//                         }`}>
//                             {problem.difficulty}
//                         </span>
//                     </div>
//                     <div className="text-sm text-gray-500 flex items-center gap-4">
//                         <span className="font-mono">/{problem.slug}</span>
//                         <span className="flex items-center gap-1">
//                             <CheckCircle size={14} className="text-green-400" />
//                             {problem.publicTestCount} public
//                         </span>
//                         <span className="flex items-center gap-1">
//                             <Database size={14} className="text-blue-400" />
//                             {problem.totalTestCount} total tests
//                         </span>
//                         <span className="flex items-center gap-1">
//                             <Code size={14} className="text-purple-400" />
//                             {problem.constraints?.length || 0} constraints
//                         </span>
//                     </div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                     <button
//                         onClick={() => setExpanded(!expanded)}
//                         className="px-3 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-all"
//                     >
//                         {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
//                     </button>
//                     <button
//                         onClick={onEdit}
//                         className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
//                     >
//                         <Edit size={16} />
//                     </button>
//                     <button
//                         onClick={onDelete}
//                         className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
//                     >
//                         <Trash2 size={16} />
//                     </button>
//                 </div>
//             </div>
            
//             {expanded && (
//                 <div className="border-t border-gray-900 p-5 bg-black/30 space-y-4">
//                     <div>
//                         <div className="text-xs font-bold uppercase text-gray-500 mb-2">Description</div>
//                         <div className="text-sm text-gray-300 whitespace-pre-wrap">{problem.description}</div>
//                     </div>
                    
//                     {problem.constraints && problem.constraints.length > 0 && (
//                         <div>
//                             <div className="text-xs font-bold uppercase text-gray-500 mb-2">Constraints</div>
//                             <ul className="text-sm text-gray-300 space-y-1">
//                                 {problem.constraints.map((c, i) => (
//                                     <li key={i} className="flex items-center gap-2">
//                                         <div className="w-1 h-1 bg-accent rounded-full"></div>
//                                         {c}
//                                     </li>
//                                 ))}
//                             </ul>
//                         </div>
//                     )}
                    
//                     <div className="grid grid-cols-2 gap-4 text-sm">
//                         <div>
//                             <div className="text-xs font-bold uppercase text-gray-500 mb-1">Time Limit</div>
//                             <div className="text-gray-300">{problem.timeLimit}ms</div>
//                         </div>
//                         <div>
//                             <div className="text-xs font-bold uppercase text-gray-500 mb-1">Memory Limit</div>
//                             <div className="text-gray-300">{problem.memoryLimit}MB</div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// // ===== PROBLEM MODAL (ADD/EDIT) =====
// const ProblemModal = ({ problem, onClose, onSuccess, username }) => {
//     const isEditing = !!problem;
    
//     const [formData, setFormData] = useState({
//         title: problem?.title || '',
//         slug: problem?.slug || '',
//         description: problem?.description || '',
//         difficulty: problem?.difficulty || 'Easy',
//         constraints: problem?.constraints || [''],
//         timeLimit: problem?.timeLimit || 5000,
//         memoryLimit: problem?.memoryLimit || 512,
//         goldenSolution: problem?.goldenSolution || '',
//         starterCode: problem?.starterCode || {
//             javascript: `const fs = require('fs');
// const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
// let idx = 0;
// function read() { return input[idx++]; }

// function solve() {
//     // Write your code here
// }
// solve();`,
//             python: `import sys

// def solve():
//     data = sys.stdin.read().split()
//     if not data: return
//     iterator = iter(data)
//     # Use next(iterator) to get inputs

// if __name__ == "__main__":
//     solve()`,
//             cpp: `#include <bits/stdc++.h>
// using namespace std;

// int main() {
//     ios_base::sync_with_stdio(false);
//     cin.tie(NULL);
    
//     // Write your code here
    
//     return 0;
// }`,
//             java: `import java.util.*;

// public class Main {
//     public static void main(String[] args) {
//         Scanner sc = new Scanner(System.in);
//         // Write your code here
//     }
// }`
//         },
//         testCases: problem?.testCases || [{ input: '', output: '', isPublic: true }]
//     });

//     const [isSubmitting, setIsSubmitting] = useState(false);

//     const handleChange = (field, value) => {
//         setFormData(prev => ({ ...prev, [field]: value }));
//     };

//     const handleConstraintChange = (index, value) => {
//         const newConstraints = [...formData.constraints];
//         newConstraints[index] = value;
//         setFormData(prev => ({ ...prev, constraints: newConstraints }));
//     };

//     const addConstraint = () => {
//         setFormData(prev => ({
//             ...prev,
//             constraints: [...prev.constraints, '']
//         }));
//     };

//     const removeConstraint = (index) => {
//         setFormData(prev => ({
//             ...prev,
//             constraints: prev.constraints.filter((_, i) => i !== index)
//         }));
//     };

//     const handleTestCaseChange = (index, field, value) => {
//         const newTestCases = [...formData.testCases];
//         newTestCases[index][field] = value;
//         setFormData(prev => ({ ...prev, testCases: newTestCases }));
//     };

//     const addTestCase = () => {
//         setFormData(prev => ({
//             ...prev,
//             testCases: [...prev.testCases, { input: '', output: '', isPublic: false }]
//         }));
//     };

//     const removeTestCase = (index) => {
//         if (formData.testCases.length <= 1) {
//             toast.error('At least one test case is required');
//             return;
//         }
//         setFormData(prev => ({
//             ...prev,
//             testCases: prev.testCases.filter((_, i) => i !== index)
//         }));
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
        
//         // Validation
//         if (!formData.title || !formData.slug || !formData.description) {
//             toast.error('Title, slug, and description are required');
//             return;
//         }

//         if (formData.testCases.length === 0 || !formData.testCases[0].input) {
//             toast.error('At least one test case with input is required');
//             return;
//         }

//         setIsSubmitting(true);
        
//         try {
//             const cleanedData = {
//                 ...formData,
//                 constraints: formData.constraints.filter(c => c.trim() !== '')
//             };

//             if (isEditing) {
//                 await api.post(`/admin/problems/${problem._id}/update`, {
//                     username,
//                     ...cleanedData
//                 });
//                 toast.success('Problem updated successfully!');
//             } else {
//                 await api.post('/admin/problems/create', {
//                     username,
//                     ...cleanedData
//                 });
//                 toast.success('Problem created successfully!');
//             }

//             onSuccess();
//         } catch (error) {
//             console.error('Problem save error:', error);
//             toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} problem`);
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     return (
//         <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
//             <div className="bg-[#111] rounded-xl border border-gray-800 w-full max-w-5xl my-8 shadow-2xl">
//                 <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#111] z-10">
//                     <h2 className="text-2xl font-bold flex items-center gap-2">
//                         {isEditing ? <Edit size={24} className="text-blue-400" /> : <Plus size={24} className="text-accent" />}
//                         {isEditing ? 'Edit Problem' : 'Add New Problem'}
//                     </h2>
//                     <button
//                         onClick={onClose}
//                         className="p-2 hover:bg-gray-800 rounded-lg transition-all"
//                     >
//                         <X size={24} />
//                     </button>
//                 </div>

//                 <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
//                     {/* Basic Info */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                             <label className="block text-sm font-bold mb-2 text-gray-300">
//                                 Title <span className="text-red-400">*</span>
//                             </label>
//                             <input
//                                 type="text"
//                                 value={formData.title}
//                                 onChange={(e) => handleChange('title', e.target.value)}
//                                 className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent transition-all"
//                                 placeholder="e.g., Two Sum"
//                                 required
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-sm font-bold mb-2 text-gray-300">
//                                 Slug <span className="text-red-400">*</span> (URL-friendly)
//                             </label>
//                             <input
//                                 type="text"
//                                 value={formData.slug}
//                                 onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
//                                 className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent font-mono transition-all"
//                                 placeholder="e.g., two-sum"
//                                 required
//                                 disabled={isEditing}
//                             />
//                             {isEditing && (
//                                 <p className="text-xs text-gray-500 mt-1">Slug cannot be changed after creation</p>
//                             )}
//                         </div>
//                     </div>

//                     {/* Description */}
//                     <div>
//                         <label className="block text-sm font-bold mb-2 text-gray-300">
//                             Description <span className="text-red-400">*</span>
//                         </label>
//                         <textarea
//                             value={formData.description}
//                             onChange={(e) => handleChange('description', e.target.value)}
//                             className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent min-h-[200px] transition-all"
//                             placeholder="Describe the problem in detail..."
//                             required
//                         />
//                     </div>

//                     {/* Difficulty & Limits */}
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                         <div>
//                             <label className="block text-sm font-bold mb-2 text-gray-300">Difficulty</label>
//                             <select
//                                 value={formData.difficulty}
//                                 onChange={(e) => handleChange('difficulty', e.target.value)}
//                                 className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent transition-all cursor-pointer"
//                             >
//                                 <option>Easy</option>
//                                 <option>Medium</option>
//                                 <option>Hard</option>
//                             </select>
//                         </div>
//                         <div>
//                             <label className="block text-sm font-bold mb-2 text-gray-300">Time Limit (ms)</label>
//                             <input
//                                 type="number"
//                                 value={formData.timeLimit}
//                                 onChange={(e) => handleChange('timeLimit', parseInt(e.target.value))}
//                                 className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent transition-all"
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-sm font-bold mb-2 text-gray-300">Memory Limit (MB)</label>
//                             <input
//                                 type="number"
//                                 value={formData.memoryLimit}
//                                 onChange={(e) => handleChange('memoryLimit', parseInt(e.target.value))}
//                                 className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent transition-all"
//                             />
//                         </div>
//                     </div>

//                     {/* Golden Solution */}
//                     <div>
//                         <label className="block text-sm font-bold mb-2 text-gray-300 flex items-center gap-2">
//                             <Zap className="text-yellow-400" size={18} />
//                             Golden Solution (JavaScript) <span className="text-red-400">*</span>
//                         </label>
//                         <p className="text-xs text-gray-500 mb-2">
//                             This is the reference solution used to verify test cases and validate user submissions.
//                             It should accept input as a string and return the expected output as a string.
//                         </p>
//                         <textarea
//                             value={formData.goldenSolution}
//                             onChange={(e) => handleChange('goldenSolution', e.target.value)}
//                             className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent font-mono text-sm min-h-[250px] transition-all"
//                             placeholder={`(input) => {
//     const parts = input.trim().split(/\\s+/);
//     const n = parseInt(parts[0]);
//     const m = parseInt(parts[1]);
    
//     // Your golden solution logic here
//     let result = "";
//     // ... implementation
    
//     return result.trim();
// }`}
//                             required
//                         />
//                     </div>

//                     {/* Constraints */}
//                     <div>
//                         <div className="flex items-center justify-between mb-3">
//                             <label className="block text-sm font-bold text-gray-300">Constraints</label>
//                             <button
//                                 type="button"
//                                 onClick={addConstraint}
//                                 className="flex items-center gap-1 text-xs px-3 py-1 bg-accent text-black rounded hover:bg-green-400 font-bold transition-all"
//                             >
//                                 <Plus size={14} />
//                                 Add
//                             </button>
//                         </div>
//                         <div className="space-y-2">
//                             {formData.constraints.map((constraint, index) => (
//                                 <div key={index} className="flex gap-2">
//                                     <input
//                                         type="text"
//                                         value={constraint}
//                                         onChange={(e) => handleConstraintChange(index, e.target.value)}
//                                         className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent transition-all"
//                                         placeholder="e.g., 1 ≤ n ≤ 10^5"
//                                     />
//                                     <button
//                                         type="button"
//                                         onClick={() => removeConstraint(index)}
//                                         className="px-3 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500 hover:text-white transition-all"
//                                     >
//                                         <X size={18} />
//                                     </button>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>

//                     {/* Test Cases */}
//                     <div>
//                         <div className="flex items-center justify-between mb-3">
//                             <label className="block text-sm font-bold text-gray-300">
//                                 Test Cases <span className="text-red-400">*</span>
//                             </label>
//                             <button
//                                 type="button"
//                                 onClick={addTestCase}
//                                 className="flex items-center gap-1 text-xs px-3 py-1 bg-accent text-black rounded hover:bg-green-400 font-bold transition-all"
//                             >
//                                 <Plus size={14} />
//                                 Add Test Case
//                             </button>
//                         </div>
//                         <div className="space-y-4">
//                             {formData.testCases.map((tc, index) => (
//                                 <div key={index} className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg space-y-3">
//                                     <div className="flex items-center justify-between">
//                                         <span className="text-sm font-bold flex items-center gap-2">
//                                             <Database size={16} className="text-blue-400" />
//                                             Test Case {index + 1}
//                                         </span>
//                                         <div className="flex items-center gap-2">
//                                             <button
//                                                 type="button"
//                                                 onClick={() => handleTestCaseChange(index, 'isPublic', !tc.isPublic)}
//                                                 className={`flex items-center gap-1 text-xs px-3 py-1 rounded font-bold transition-all ${
//                                                     tc.isPublic 
//                                                         ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
//                                                         : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
//                                                 }`}
//                                             >
//                                                 {tc.isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
//                                                 {tc.isPublic ? 'Public' : 'Hidden'}
//                                             </button>
//                                             {formData.testCases.length > 1 && (
//                                                 <button
//                                                     type="button"
//                                                     onClick={() => removeTestCase(index)}
//                                                     className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500 hover:text-white transition-all"
//                                                 >
//                                                     <Trash2 size={16} />
//                                                 </button>
//                                             )}
//                                         </div>
//                                     </div>
//                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                                         <div>
//                                             <label className="block text-xs text-gray-500 mb-1">Input</label>
//                                             <textarea
//                                                 value={tc.input}
//                                                 onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
//                                                 className="w-full px-3 py-2 bg-black border border-gray-800 rounded font-mono text-sm focus:outline-none focus:border-accent min-h-[100px] transition-all"
//                                                 placeholder="5 3"
//                                                 required
//                                             />
//                                         </div>
//                                         <div>
//                                             <label className="block text-xs text-gray-500 mb-1">Expected Output</label>
//                                             <textarea
//                                                 value={tc.output}
//                                                 onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
//                                                 className="w-full px-3 py-2 bg-black border border-gray-800 rounded font-mono text-sm focus:outline-none focus:border-accent min-h-[100px] transition-all"
//                                                 placeholder="8"
//                                                 required
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>

//                     {/* Starter Code */}
//                     <details className="bg-[#0a0a0a] border border-gray-800 rounded-lg">
//                         <summary className="p-4 cursor-pointer font-bold hover:bg-gray-900 transition-all flex items-center gap-2">
//                             <Code size={18} />
//                             Starter Code (Optional - Click to expand)
//                         </summary>
//                         <div className="p-4 space-y-4 border-t border-gray-800">
//                             {Object.keys(formData.starterCode).map(lang => (
//                                 <div key={lang}>
//                                     <label className="block text-sm font-bold mb-2 capitalize text-gray-300">{lang}</label>
//                                     <textarea
//                                         value={formData.starterCode[lang]}
//                                         onChange={(e) => handleChange('starterCode', {
//                                             ...formData.starterCode,
//                                             [lang]: e.target.value
//                                         })}
//                                         className="w-full px-3 py-2 bg-black border border-gray-800 rounded font-mono text-xs focus:outline-none focus:border-accent min-h-[200px] transition-all"
//                                     />
//                                 </div>
//                             ))}
//                         </div>
//                     </details>

//                     {/* Submit */}
//                     <div className="flex gap-3 pt-6 border-t border-gray-800">
//                         <button
//                             type="button"
//                             onClick={onClose}
//                             className="flex-1 px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 font-bold transition-all"
//                             disabled={isSubmitting}
//                         >
//                             Cancel
//                         </button>
//                         <button
//                             type="submit"
//                             className="flex-1 px-6 py-3 bg-gradient-to-r from-accent to-green-400 text-black rounded-lg hover:from-green-400 hover:to-accent font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
//                             disabled={isSubmitting}
//                         >
//                             {isSubmitting ? (
//                                 <>
//                                     <RefreshCw size={18} className="animate-spin" />
//                                     {isEditing ? 'Updating...' : 'Creating...'}
//                                 </>
//                             ) : (
//                                 <>
//                                     <Save size={18} />
//                                     {isEditing ? 'Update Problem' : 'Create Problem'}
//                                 </>
//                             )}
//                         </button>
//                     </div>
//                 </form>
//             </div>

//             <style jsx>{`
//                 .custom-scrollbar::-webkit-scrollbar {
//                     width: 8px;
//                 }
//                 .custom-scrollbar::-webkit-scrollbar-track {
//                     background: #0a0a0a;
//                 }
//                 .custom-scrollbar::-webkit-scrollbar-thumb {
//                     background: #333;
//                     border-radius: 4px;
//                 }
//                 .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//                     background: #555;
//                 }
//                 .scrollbar-hide::-webkit-scrollbar {
//                     display: none;
//                 }
//                 .scrollbar-hide {
//                     -ms-overflow-style: none;
//                     scrollbar-width: none;
//                 }
//             `}</style>
//         </div>
//     );
// };

// export default AdminDashboard;

// // the most updated




































import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Trophy, TrendingUp, Activity, Clock, AlertTriangle,
    RefreshCw, Trash2, Edit, Search, BarChart, Shield, LogOut,
    Code, Plus, X, Eye, EyeOff, Save, ChevronDown, ChevronUp,
    CheckCircle, Zap, Database, Star,
    ChevronLeft, ChevronRight, Download, ArrowUp,
    ArrowDown, Target, HardDrive,
    Wifi, AlertCircle, Info, Layers,
    UserCheck, BarChart2, PieChart, TrendingDown,
    Server, Radio, Save as SaveIcon
} from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';
import LiveUsersTable from '../components/LiveUsersTable';
import { CAMPAIGN_REGIONS } from '../data/campaignConfig';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const TABS = [
    { id: 'overview',    icon: Activity,  label: 'Overview'    },
    { id: 'live',        icon: Radio,     label: 'Live'        },
    { id: 'users',       icon: Users,     label: 'Users'       },
    { id: 'matches',     icon: Trophy,    label: 'Matches'     },
    { id: 'problems',    icon: Code,      label: 'Problems'    },
    { id: 'leaderboard', icon: Star,      label: 'Leaderboard' },
    { id: 'analytics',   icon: BarChart,  label: 'Analytics'   },
    { id: 'system',      icon: Server,    label: 'System'      },
];

const DIFF_COLORS = {
    Easy:   { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    Medium: { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30'  },
    Hard:   { bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/30'    },
};

const PROBLEM_TYPE_META = {
    battle: {
        label: 'Battle Arena (1v1)',
        shortLabel: 'Battle Arena',
        description: 'Randomized competitive problems used in live 1v1 rooms.',
    },
    campaign: {
        label: 'Campaign Mode',
        shortLabel: 'Campaign',
        description: 'Region-based progression nodes surfaced on the campaign map.',
    },
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) : '—';
const fmtDateTime = (d) => d ? `${fmtDate(d)}, ${fmtTime(d)}` : '—';
const fmtDuration = (ms) => {
    if (!ms) return '—';
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
};
const calcWinRate = (wins, total) => total > 0 ? ((wins / total) * 100).toFixed(1) + '%' : '0%';

const exportCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([headers + '\n' + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
};

// ═══════════════════════════════════════════════════════════════
// MINI COMPONENTS
// ═══════════════════════════════════════════════════════════════
const Badge = ({ children, color = 'gray' }) => {
    const colors = {
        green:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        red:    'bg-red-500/15 text-red-400 border-red-500/30',
        yellow: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        blue:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
        purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        gray:   'bg-gray-500/15 text-gray-400 border-gray-500/30',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors[color]}`}>
            {children}
        </span>
    );
};

const Spinner = ({ size = 8 }) => (
    <div className={`animate-spin rounded-full h-${size} w-${size} border-2 border-gray-700 border-t-accent`} />
);

const EmptyState = ({ icon: Icon, title, sub }) => (
    <div className="flex flex-col items-center justify-center py-16 text-gray-600">
        <Icon size={48} className="mb-4 opacity-40" />
        <p className="text-lg font-semibold text-gray-500">{title}</p>
        {sub && <p className="text-sm mt-1">{sub}</p>}
    </div>
);

const SortBtn = ({ field, current, dir, onClick }) => (
    <button onClick={() => onClick(field)} className="ml-1 inline-flex flex-col opacity-50 hover:opacity-100 transition-opacity">
        <ArrowUp size={10} className={current === field && dir === 'asc' ? 'text-accent' : ''} />
        <ArrowDown size={10} className={current === field && dir === 'desc' ? 'text-accent' : ''} />
    </button>
);

const StatCard = ({ icon, title, value, subtitle, delta, color = 'accent' }) => {
    const colors = { accent:'from-accent/20 to-accent/5 border-accent/20', blue:'from-blue-500/20 to-blue-500/5 border-blue-500/20', yellow:'from-amber-500/20 to-amber-500/5 border-amber-500/20', green:'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20', purple:'from-purple-500/20 to-purple-500/5 border-purple-500/20', red:'from-red-500/20 to-red-500/5 border-red-500/20' };
    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5 hover:scale-[1.02] transition-all duration-200 shadow-lg`}>
            <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-black/30 rounded-lg">{icon}</div>
                {delta !== undefined && (
                    <span className={`text-xs font-bold flex items-center gap-1 ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {delta >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                        {Math.abs(delta)}%
                    </span>
                )}
            </div>
            <div className="text-3xl font-black text-white mb-0.5">{value}</div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</div>
            {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        </div>
    );
};

const Paginator = ({ page, total, perPage, onChange }) => {
    const pages = Math.ceil(total / perPage);
    if (pages <= 1) return null;
    return (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
            <span className="text-sm text-gray-500">Page {page} of {pages} · {total} total</span>
            <div className="flex gap-2">
                <button onClick={() => onChange(page-1)} disabled={page===1} className="px-3 py-1.5 bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-all text-sm">
                    <ChevronLeft size={16}/>
                </button>
                {[...Array(Math.min(5,pages))].map((_,i) => {
                    const p = i+1;
                    return <button key={p} onClick={() => onChange(p)} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${p===page ? 'bg-accent text-black font-bold' : 'bg-gray-800 hover:bg-gray-700'}`}>{p}</button>;
                })}
                {pages > 5 && <span className="px-2 text-gray-600 self-center">...</span>}
                <button onClick={() => onChange(page+1)} disabled={page===pages} className="px-3 py-1.5 bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-all text-sm">
                    <ChevronRight size={16}/>
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const AdminDashboard = () => {
    const [adminUser, setAdminUser]             = useState(null);
    const [stats, setStats]                     = useState(null);
    const [users, setUsers]                     = useState([]);
    const [matches, setMatches]                 = useState([]);
    const [problems, setProblems]               = useState([]);
    const [recentActivity, setRecentActivity]   = useState({ matches:[], users:[] });
    const [hourlyActivity, setHourlyActivity]   = useState([]);
    const [systemHealth, setSystemHealth]       = useState(null);
    const [loading, setLoading]                 = useState(true);
    const [refreshing, setRefreshing]           = useState(false);
    const [activeTab, setActiveTab]             = useState('overview');

    // Modals
    const [showAddProblem, setShowAddProblem]   = useState(false);
    const [createProblemType, setCreateProblemType] = useState('battle');
    const [editingProblem, setEditingProblem]   = useState(null);
    const [viewingUser, setViewingUser]         = useState(null);
    const [editingUser, setEditingUser]         = useState(null);
    const [viewingMatch, setViewingMatch]       = useState(null);

    // Filters & Sort
    const [search, setSearch]                   = useState('');
    const [matchSearch, setMatchSearch]         = useState('');
    const [filterDiff, setFilterDiff]           = useState('all');
    const [filterDate, setFilterDate]           = useState('all');
    const [problemView, setProblemView]         = useState('battle');
    const [regionFilter, setRegionFilter]       = useState('all');
    const [userSort, setUserSort]               = useState({ field:'createdAt', dir:'desc' });
    const [matchSort, setMatchSort]             = useState({ field:'createdAt', dir:'desc' });

    // Pagination
    const [userPage, setUserPage]               = useState(1);
    const [matchPage, setMatchPage]             = useState(1);
    const PER_PAGE = 20;

    const navigate = useNavigate();
    const refreshInterval = useRef(null);

    // ── AUTH CHECK ──────────────────────────────────────────────
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('codearena_user'));
        if (!stored) { navigate('/login'); return; }
        const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
        if (stored.username !== adminUsername) {
            toast.error('Access Denied: Admin privileges required');
            navigate('/dashboard'); return;
        }
        setAdminUser(stored);
        fetchAll(stored.username);

        // Auto-refresh every 30s
        refreshInterval.current = setInterval(() => fetchLiveStats(stored.username), 30000);
        return () => clearInterval(refreshInterval.current);
    }, [navigate]);

    // ── DATA FETCHING ────────────────────────────────────────────
    const fetchAll = async (username) => {
        setLoading(true);
        try {
            const [statsRes, usersRes, activityRes, hourlyRes, problemsRes, matchesRes, healthRes] = await Promise.all([
                api.post('/admin/stats',              { username }),
                api.post('/admin/users',              { username, limit: 500 }),
                api.post('/admin/activity/recent',    { username }),
                api.post('/admin/activity/hourly',    { username }),
                api.post('/admin/problems',           { username }),
                api.post('/admin/matches',            { username, limit: 500 }),
                api.post('/admin/system/health',      { username }).catch(() => ({ data: null })),
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data.users || []);
            setRecentActivity(activityRes.data);
            setHourlyActivity(hourlyRes.data.hourlyActivity || []);
            setProblems(problemsRes.data.problems || []);
            setMatches(matchesRes.data.matches || []);
            setSystemHealth(healthRes.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const fetchLiveStats = async (username) => {
        try {
            const res = await api.post('/admin/stats', { username });
            setStats(res.data);
        } catch {}
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAll(adminUser.username);
        setRefreshing(false);
        toast.success('Data refreshed');
    };

    // ── USER ACTIONS ─────────────────────────────────────────────
    const handleDeleteUser = async (userId, username) => {
        if (!confirm(`Delete user "${username}" and ALL their match history?`)) return;
        try {
            await api.post(`/admin/users/${userId}/delete`, { username: adminUser.username });
            toast.success(`User "${username}" deleted`);
            setUsers(prev => prev.filter(u => u._id !== userId));
        } catch { toast.error('Failed to delete user'); }
    };

    const handleUpdateUserStats = async (userId, data) => {
        try {
            const res = await api.post(`/admin/users/${userId}/update-stats`, {
                username: adminUser.username, ...data
            });
            toast.success('User stats updated');
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, ...res.data.user } : u));
            setEditingUser(null);
        } catch { toast.error('Failed to update stats'); }
    };

    const handleBanUser = async (userId, username) => {
        if (!confirm(`Ban user "${username}"? They will be unable to login.`)) return;
        try {
            await api.post(`/admin/users/${userId}/ban`, { username: adminUser.username });
            toast.success(`User "${username}" banned`);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, banned: true } : u));
        } catch { toast.error('Failed to ban user'); }
    };

    // ── PROBLEM ACTIONS ──────────────────────────────────────────
    const handleDeleteProblem = async (problemId, title) => {
        if (!confirm(`Delete problem "${title}"? This may affect ongoing matches!`)) return;
        try {
            await api.post(`/admin/problems/${problemId}/delete`, { username: adminUser.username });
            toast.success('Problem deleted');
            setProblems(prev => prev.filter(p => p._id !== problemId));
        } catch { toast.error('Failed to delete problem'); }
    };

    // ── LEADERBOARD ACTIONS ──────────────────────────────────────
    const handleResetSeason = async () => {
        if (!confirm('⚠️ Reset ALL season scores to 0? Cannot be undone!')) return;
        try {
            const res = await api.post('/admin/leaderboard/reset-season', { username: adminUser.username });
            toast.success(res.data.message);
            fetchAll(adminUser.username);
        } catch { toast.error('Failed to reset season scores'); }
    };

    const handleResetAll = async () => {
        if (!confirm('⚠️ RESET ALL STATS (ELO, Season, Wins, Losses)?')) return;
        if (!confirm('FINAL WARNING: This is completely irreversible. Proceed?')) return;
        try {
            const res = await api.post('/admin/leaderboard/reset-all', { username: adminUser.username });
            toast.success(res.data.message);
            fetchAll(adminUser.username);
        } catch { toast.error('Failed to reset all stats'); }
    };

    const handleClearMatches = async () => {
        if (!confirm('⚠️ Delete ALL match history? Cannot be undone!')) return;
        try {
            const res = await api.post('/admin/matches/clear', { username: adminUser.username });
            toast.success(res.data.message);
            setMatches([]);
            fetchAll(adminUser.username);
        } catch { toast.error('Failed to clear matches'); }
    };

    // ── COMPUTED / FILTERED DATA ─────────────────────────────────
    const sortedUsers = useMemo(() => {
        let data = [...users].filter(u =>
            u.username?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
        );
        data.sort((a, b) => {
            let av = a[userSort.field] ?? 0;
            let bv = b[userSort.field] ?? 0;
            if (typeof av === 'string') av = av.toLowerCase();
            if (typeof bv === 'string') bv = bv.toLowerCase();
            if (userSort.field === 'stats.wins') { av = a.stats?.wins??0; bv = b.stats?.wins??0; }
            if (userSort.field === 'stats.matchesPlayed') { av = a.stats?.matchesPlayed??0; bv = b.stats?.matchesPlayed??0; }
            return userSort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
        });
        return data;
    }, [users, search, userSort]);

    const paginatedUsers = useMemo(() => {
        const start = (userPage - 1) * PER_PAGE;
        return sortedUsers.slice(start, start + PER_PAGE);
    }, [sortedUsers, userPage]);

    const sortedMatches = useMemo(() => {
        let data = [...matches].filter(m => {
            const p0 = m.players?.[0]?.username || '';
            const p1 = m.players?.[1]?.username || '';
            const winner = m.winner || '';
            const problem = m.problem?.title || '';
            const q = matchSearch.toLowerCase();
            const matchesSearch = !q || p0.toLowerCase().includes(q) || p1.toLowerCase().includes(q) ||
                winner.toLowerCase().includes(q) || problem.toLowerCase().includes(q);
            const now = new Date();
            const matchDate = new Date(m.createdAt);
            const matchesDate = filterDate === 'all' ? true :
                filterDate === 'today' ? (now - matchDate) < 86400000 :
                filterDate === 'week'  ? (now - matchDate) < 604800000 :
                filterDate === 'month' ? (now - matchDate) < 2592000000 : true;
            return matchesSearch && matchesDate;
        });
        data.sort((a, b) => {
            let av = a[matchSort.field] ?? 0;
            let bv = b[matchSort.field] ?? 0;
            return matchSort.dir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
        });
        return data;
    }, [matches, matchSearch, filterDate, matchSort]);

    const paginatedMatches = useMemo(() => {
        const start = (matchPage - 1) * PER_PAGE;
        return sortedMatches.slice(start, start + PER_PAGE);
    }, [sortedMatches, matchPage]);

    const battleProblems = useMemo(
        () => problems.filter((problem) => (problem.type || 'battle') === 'battle'),
        [problems]
    );

    const campaignProblems = useMemo(
        () => problems.filter((problem) => problem.type === 'campaign'),
        [problems]
    );

    const campaignRegionOptions = useMemo(
        () => CAMPAIGN_REGIONS.map(r => ({ id: r.id, name: r.name })),
        []
    );

    const filteredProblems = useMemo(() => {
        const q = search.toLowerCase();
        const source = problemView === 'campaign' ? campaignProblems : battleProblems;

        return source.filter((problem) => {
            const matchesSearch =
                problem.title?.toLowerCase().includes(q) ||
                problem.slug?.toLowerCase().includes(q) ||
                problem.campaignNodeId?.toLowerCase().includes(q);
            const matchesDifficulty = filterDiff === 'all' || problem.difficulty === filterDiff;
            const matchesRegion = problemView !== 'campaign' ||
                regionFilter === 'all' ||
                String(problem.campaignRegion) === regionFilter;

            return matchesSearch && matchesDifficulty && matchesRegion;
        });
    }, [battleProblems, campaignProblems, filterDiff, problemView, regionFilter, search]);

    const toggleSort = useCallback((field, type) => {
        if (type === 'user') setUserSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));
        else setMatchSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));
    }, []);

    // ── LOADING STATE ────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent via-green-400 to-emerald-600 flex items-center justify-center mx-auto shadow-2xl shadow-accent/30 animate-pulse">
                        <Shield size={36} className="text-black" />
                    </div>
                </div>
                <div className="flex items-center gap-3 justify-center">
                    <Spinner size={5}/>
                    <p className="text-gray-400 font-medium">Initializing Admin Control Center...</p>
                </div>
            </div>
        </div>
    );

    // ── RENDER ───────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#080808] text-white font-sans">

            {/* ── HEADER ─────────────────────────────────────────── */}
            <header className="bg-[#0d0d0d]/95 border-b border-gray-800/60 sticky top-0 z-50 backdrop-blur-xl shadow-2xl">
                <div className="max-w-[1600px] mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-emerald-600 flex items-center justify-center shadow-lg shadow-accent/20 shrink-0">
                            <Shield size={22} className="text-black" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight text-white">CodeArena Admin</h1>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
                                Signed in as <span className="text-accent font-semibold">{adminUser?.username}</span>
                                <span className="text-gray-700">·</span>
                                <span>{users.length} users · {matches.length} matches</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleRefresh} disabled={refreshing}
                            className="flex items-center gap-2 px-3.5 py-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-all text-sm font-medium border border-gray-700/50 hover:border-gray-600">
                            <RefreshCw size={15} className={refreshing ? 'animate-spin text-accent' : ''}/>
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                        <button onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 px-3.5 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 rounded-lg transition-all text-sm font-medium border border-red-500/20 hover:border-red-500/40">
                            <LogOut size={15}/>
                            Exit Admin
                        </button>
                    </div>
                </div>
            </header>

            {/* ── TABS ───────────────────────────────────────────── */}
            <nav className="bg-[#0a0a0a]/95 border-b border-gray-800/60 sticky top-[57px] z-40 backdrop-blur-xl">
                <div className="max-w-[1600px] mx-auto px-6">
                    <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
                        {TABS.map(tab => (
                            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch(''); setMatchSearch(''); }}
                                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-accent text-accent bg-accent/5'
                                        : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/40'
                                }`}>
                                <tab.icon size={16}/>
                                {tab.label}
                                {tab.id === 'users'    && <span className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400 font-mono">{users.length}</span>}
                                {tab.id === 'matches'  && <span className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400 font-mono">{matches.length}</span>}
                                {tab.id === 'problems' && <span className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400 font-mono">{problems.length}</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* ── CONTENT ────────────────────────────────────────── */}
            <main className="max-w-[1600px] mx-auto p-6 space-y-6">

                {/* ════════ OVERVIEW TAB ════════ */}
                {activeTab === 'overview' && (
                    <OverviewTab
                        stats={stats}
                        users={users}
                        matches={matches}
                        problems={problems}
                        recentActivity={recentActivity}
                        hourlyActivity={hourlyActivity}
                    />
                )}

                {/* ════════ USERS TAB ════════ */}
                {activeTab === 'users' && (
                    <div className="space-y-4">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[240px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                                <input type="text" placeholder="Search users by username or email..." value={search}
                                    onChange={e => { setSearch(e.target.value); setUserPage(1); }}
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 text-sm transition-all"/>
                            </div>
                            <button onClick={() => exportCSV(sortedUsers.map(u => ({
                                username: u.username, email: u.email||'', rating: u.rating||1000,
                                seasonScore: u.seasonScore||0, wins: u.stats?.wins||0,
                                losses: u.stats?.losses||0, matches: u.stats?.matchesPlayed||0,
                                joined: fmtDate(u.createdAt)
                            })), 'users.csv')} className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/80 hover:bg-gray-700 border border-gray-700/50 rounded-xl text-sm font-medium transition-all">
                                <Download size={15}/> Export CSV
                            </button>
                        </div>

                        {/* Stats bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label:'Total Users',   val: users.length, color:'text-white' },
                                { label:'Active (played ≥1 match)', val: users.filter(u=>u.stats?.matchesPlayed>0).length, color:'text-emerald-400' },
                                { label:'Inactive (0 matches)', val: users.filter(u=>!u.stats?.matchesPlayed).length, color:'text-amber-400' },
                                { label:'Avg Rating', val: users.length ? Math.round(users.reduce((a,u)=>a+(u.rating||1000),0)/users.length) : 0, color:'text-blue-400' },
                            ].map(s => (
                                <div key={s.label} className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-3.5">
                                    <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Table */}
                        <div className="bg-gray-900/30 border border-gray-800/60 rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-900/60 border-b border-gray-800">
                                        <tr>
                                            {[
                                                { label:'#',        field:null },
                                                { label:'User',     field:'username' },
                                                { label:'Email',    field:'email' },
                                                { label:'Rating',   field:'rating' },
                                                { label:'Season',   field:'seasonScore' },
                                                { label:'W',        field:'stats.wins' },
                                                { label:'L',        field:null },
                                                { label:'Matches',  field:'stats.matchesPlayed' },
                                                { label:'Win Rate', field:null },
                                                { label:'Joined',   field:'createdAt' },
                                                { label:'Actions',  field:null },
                                            ].map(col => (
                                                <th key={col.label} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                    <span className="flex items-center">
                                                        {col.label}
                                                        {col.field && <SortBtn field={col.field} current={userSort.field} dir={userSort.dir} onClick={f=>toggleSort(f,'user')}/>}
                                                    </span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {paginatedUsers.map((u, idx) => {
                                            const rank = (userPage-1)*PER_PAGE + idx + 1;
                                            const wins = u.stats?.wins || 0;
                                            const losses = u.stats?.losses || 0;
                                            const total = u.stats?.matchesPlayed || 0;
                                            return (
                                                <tr key={u._id} className="hover:bg-gray-800/30 transition-colors group">
                                                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{rank}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/60 to-emerald-600/60 flex items-center justify-center text-xs font-black text-white shrink-0">
                                                                {u.username?.[0]?.toUpperCase() || '?'}
                                                            </div>
                                                            <button onClick={() => setViewingUser(u)} className="font-semibold hover:text-accent transition-colors text-left">
                                                                {u.username}
                                                            </button>
                                                            {u.banned && <Badge color="red">Banned</Badge>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400 text-xs">{u.email || '—'}</td>
                                                    <td className="px-4 py-3 font-mono font-bold text-amber-400">{u.rating || 1000}</td>
                                                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">{u.seasonScore || 0}</td>
                                                    <td className="px-4 py-3 text-emerald-400 font-bold">{wins}</td>
                                                    <td className="px-4 py-3 text-red-400 font-bold">{losses}</td>
                                                    <td className="px-4 py-3 font-mono">{total}</td>
                                                    <td className="px-4 py-3">
                                                        <WinRateBar wins={wins} total={total}/>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => setViewingUser(u)} title="View Profile"
                                                                className="p-1.5 bg-blue-500/15 text-blue-400 rounded hover:bg-blue-500/30 transition-all">
                                                                <Eye size={14}/>
                                                            </button>
                                                            <button onClick={() => setEditingUser({...u})} title="Edit Stats"
                                                                className="p-1.5 bg-amber-500/15 text-amber-400 rounded hover:bg-amber-500/30 transition-all">
                                                                <Edit size={14}/>
                                                            </button>
                                                            <button onClick={() => handleDeleteUser(u._id, u.username)} title="Delete User"
                                                                className="p-1.5 bg-red-500/15 text-red-400 rounded hover:bg-red-500/30 transition-all">
                                                                <Trash2 size={14}/>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {paginatedUsers.length === 0 && (
                                            <tr><td colSpan={11}><EmptyState icon={Users} title="No users found" sub="Try adjusting your search"/></td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-4 pb-4">
                                <Paginator page={userPage} total={sortedUsers.length} perPage={PER_PAGE} onChange={setUserPage}/>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════ MATCHES TAB ════════ */}
                {activeTab === 'matches' && (
                    <div className="space-y-4">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[240px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                                <input type="text" placeholder="Search by player, winner, or problem..." value={matchSearch}
                                    onChange={e => { setMatchSearch(e.target.value); setMatchPage(1); }}
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 text-sm transition-all"/>
                            </div>
                            <select value={filterDate} onChange={e => { setFilterDate(e.target.value); setMatchPage(1); }}
                                className="px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 text-sm cursor-pointer">
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                            <button onClick={() => exportCSV(sortedMatches.map(m => ({
                                player1: m.players?.[0]?.username||'?', player2: m.players?.[1]?.username||'?',
                                winner: m.winner||'?', problem: m.problem?.title||'?',
                                status: m.status||'?', date: fmtDateTime(m.createdAt)
                            })), 'matches.csv')} className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/80 hover:bg-gray-700 border border-gray-700/50 rounded-xl text-sm font-medium transition-all">
                                <Download size={15}/> Export CSV
                            </button>
                        </div>

                        {/* Stats bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label:'Total Matches',  val: matches.length, color:'text-white' },
                                { label:'Completed', val: matches.filter(m=>m.status==='completed').length, color:'text-emerald-400' },
                                { label:'Draws/Ties',     val: matches.filter(m=>m.winner==='draw'||m.winner==='tie').length, color:'text-amber-400' },
                                { label:'Today',     val: matches.filter(m=>(new Date()-new Date(m.createdAt))<86400000).length, color:'text-blue-400' },
                            ].map(s => (
                                <div key={s.label} className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-3.5">
                                    <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Table */}
                        <div className="bg-gray-900/30 border border-gray-800/60 rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-900/60 border-b border-gray-800">
                                        <tr>
                                            {['#','Player 1','Player 2','Winner','Problem','Status','Date',''].map(h => (
                                                <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {paginatedMatches.map((m, idx) => {
                                            const rank = (matchPage-1)*PER_PAGE + idx + 1;
                                            const p0 = m.players?.[0]?.username || '?';
                                            const p1 = m.players?.[1]?.username || '?';
                                            const isP0Winner = m.winner === p0;
                                            const isP1Winner = m.winner === p1;
                                            return (
                                                <tr key={m._id || idx} className="hover:bg-gray-800/30 transition-colors group">
                                                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{rank}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`font-semibold ${isP0Winner ? 'text-amber-400' : 'text-gray-300'}`}>
                                                            {isP0Winner && <Trophy size={12} className="inline mr-1"/>}
                                                            {p0}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`font-semibold ${isP1Winner ? 'text-amber-400' : 'text-gray-300'}`}>
                                                            {isP1Winner && <Trophy size={12} className="inline mr-1"/>}
                                                            {p1}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {m.winner === 'draw' || m.winner === 'tie'
                                                            ? <Badge color="gray">Draw</Badge>
                                                            : <span className="font-bold text-amber-400">{m.winner || '?'}</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[160px] truncate">
                                                        {m.problem?.title || '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge color={m.status==='completed'?'green':m.status==='active'?'blue':'gray'}>
                                                            {m.status || 'unknown'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDateTime(m.createdAt)}</td>
                                                    <td className="px-4 py-3">
                                                        <button onClick={() => setViewingMatch(m)}
                                                            className="p-1.5 bg-blue-500/15 text-blue-400 rounded hover:bg-blue-500/30 transition-all opacity-0 group-hover:opacity-100">
                                                            <Eye size={14}/>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {paginatedMatches.length === 0 && (
                                            <tr><td colSpan={8}><EmptyState icon={Trophy} title="No matches found" sub="Try adjusting filters"/></td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-4 pb-4">
                                <Paginator page={matchPage} total={sortedMatches.length} perPage={PER_PAGE} onChange={setMatchPage}/>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════ PROBLEMS TAB ════════ */}
                {activeTab === 'problems' && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[240px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                                <input type="text" placeholder="Search problems..." value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 text-sm transition-all"/>
                            </div>
                            <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)}
                                className="px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 text-sm cursor-pointer">
                                <option value="all">All Difficulties</option>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                            <button onClick={() => {
                                setCreateProblemType(problemView);
                                setShowAddProblem(true);
                            }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/80 text-black rounded-xl text-sm font-bold transition-all shadow-lg shadow-accent/20 hover:shadow-accent/30">
                                <Plus size={16}/> Add Problem
                            </button>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
                            <div className="grid gap-2 md:grid-cols-2">
                                {Object.entries(PROBLEM_TYPE_META).map(([key, meta]) => {
                                    const isActive = problemView === key;

                                    return (
                                        <button
                                            key={key}
                                            onClick={() => {
                                                setProblemView(key);
                                                setRegionFilter('all');
                                            }}
                                            className={`rounded-xl border px-4 py-4 text-left transition-all ${
                                                isActive
                                                    ? 'border-emerald-400/40 bg-emerald-400/12 shadow-[0_12px_35px_rgba(74,222,128,0.12)]'
                                                    : 'border-white/8 bg-black/10 hover:border-white/15 hover:bg-white/[0.06]'
                                            }`}
                                        >
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <span className={`text-sm font-black ${isActive ? 'text-white' : 'text-gray-300'}`}>
                                                    {meta.label}
                                                </span>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                    isActive ? 'bg-emerald-400/15 text-emerald-300' : 'bg-gray-800/80 text-gray-500'
                                                }`}>
                                                    {key === 'battle' ? battleProblems.length : campaignProblems.length}
                                                </span>
                                            </div>
                                            <p className="text-xs leading-relaxed text-gray-500">{meta.description}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Problem stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {['Easy','Medium','Hard'].map(d => {
                                const dc = DIFF_COLORS[d] || DIFF_COLORS.Easy;
                                const source = problemView === 'campaign' ? campaignProblems : battleProblems;
                                return (
                                    <div key={d} className={`${dc.bg} border ${dc.border} rounded-xl p-3.5`}>
                                        <div className={`text-xl font-black ${dc.text}`}>{source.filter(p=>p.difficulty===d).length}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{d} Problems</div>
                                    </div>
                                );
                            })}
                            <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-3.5">
                                <div className="text-xl font-black text-white">{filteredProblems.reduce((a,p)=>a+(p.totalTestCount||0),0)}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                    {problemView === 'campaign' ? 'Filtered Campaign Tests' : 'Battle Arena Test Cases'}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-800/60 bg-gray-900/30 overflow-hidden">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800/60 px-5 py-4">
                                <div>
                                    <h3 className="text-base font-bold text-white">{PROBLEM_TYPE_META[problemView].label}</h3>
                                    <p className="text-xs text-gray-500">
                                        {problemView === 'campaign'
                                            ? 'Campaign nodes are grouped by region and target node ID.'
                                            : 'Battle Arena pulls only competitive 1v1 problems into live rooms.'}
                                    </p>
                                </div>
                                {problemView === 'campaign' && (
                                    <select
                                        value={regionFilter}
                                        onChange={(e) => setRegionFilter(e.target.value)}
                                        className="rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-2.5 text-sm focus:outline-none focus:border-accent/60"
                                    >
                                        <option value="all">All Regions</option>
                                        {CAMPAIGN_REGIONS.map((region) => (
                                            <option key={region.id} value={String(region.id)}>
                                                Region {region.id}: {region.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {filteredProblems.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-black/20">
                                            <tr>
                                                {[
                                                    'Title',
                                                    'Slug',
                                                    'Difficulty',
                                                    ...(problemView === 'campaign' ? ['Region', 'Node ID'] : []),
                                                    'Tests',
                                                    'Limits',
                                                    '',
                                                ].map((header) => (
                                                    <th
                                                        key={header}
                                                        className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500"
                                                    >
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800/60">
                                            {filteredProblems.map((problem) => {
                                                const diffColor = DIFF_COLORS[problem.difficulty] || DIFF_COLORS.Easy;

                                                return (
                                                    <tr key={problem._id} className="hover:bg-white/[0.03] transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-white">{problem.title}</div>
                                                            <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                                                                {problem.description}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">/{problem.slug}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${diffColor.bg} ${diffColor.text} ${diffColor.border}`}>
                                                                {problem.difficulty}
                                                            </span>
                                                        </td>
                                                        {problemView === 'campaign' && (
                                                            <>
                                                                <td className="px-4 py-3 text-gray-300">
                                                                    {problem.campaignRegion ? `Region ${problem.campaignRegion}` : '—'}
                                                                </td>
                                                                <td className="px-4 py-3 font-mono text-xs text-cyan-300">
                                                                    {problem.campaignNodeId || '—'}
                                                                </td>
                                                            </>
                                                        )}
                                                        <td className="px-4 py-3 text-xs text-gray-400">
                                                            <div>{problem.publicTestCount || 0} public</div>
                                                            <div className="text-gray-600">{problem.totalTestCount || 0} total</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-gray-400">
                                                            <div>{problem.timeLimit}ms</div>
                                                            <div className="text-gray-600">{problem.memoryLimit}MB</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => setEditingProblem(problem)}
                                                                    className="rounded-lg bg-blue-500/15 p-2 text-blue-400 transition-all hover:bg-blue-500/30"
                                                                >
                                                                    <Edit size={15}/>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteProblem(problem._id, problem.title)}
                                                                    className="rounded-lg bg-red-500/15 p-2 text-red-400 transition-all hover:bg-red-500/30"
                                                                >
                                                                    <Trash2 size={15}/>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={problemView === 'campaign' ? Target : Code}
                                    title={problemView === 'campaign' ? 'No campaign nodes yet' : 'No battle problems found'}
                                    sub={problemView === 'campaign'
                                        ? 'Create the first campaign problem and assign a region + node ID.'
                                        : 'Add your first Battle Arena problem to power 1v1 matches.'}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* ════════ LEADERBOARD TAB ════════ */}
                {activeTab === 'leaderboard' && (
                    <div className="space-y-6">
                        {/* Danger zone */}
                        <div className="bg-gray-900/30 border border-gray-800/60 rounded-xl p-6">
                            <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-red-400">
                                <AlertTriangle size={20}/> Danger Zone — Irreversible Actions
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <ActionCard icon={<RefreshCw size={28} className="text-amber-400"/>}
                                    title="Reset Season Scores" severity="medium"
                                    description="Set all seasonScore to 0. ELO & win/loss stats remain intact."
                                    onClick={handleResetSeason}/>
                                <ActionCard icon={<AlertTriangle size={28} className="text-red-400"/>}
                                    title="Reset ALL Stats" severity="high"
                                    description="Reset ELO to 1000, season to 0, wins & losses to 0 for every user."
                                    onClick={handleResetAll}/>
                                <ActionCard icon={<Trash2 size={28} className="text-purple-400"/>}
                                    title="Clear Match History" severity="high"
                                    description="Permanently delete every match record from the database."
                                    onClick={handleClearMatches}/>
                            </div>
                        </div>

                        {/* Live leaderboard preview */}
                        <div className="bg-gray-900/30 border border-gray-800/60 rounded-xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-800/60 flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2"><Trophy size={18} className="text-amber-400"/> Current Top 20 by Rating</h3>
                            </div>
                            <div className="divide-y divide-gray-800/40">
                                {[...users].sort((a,b)=>(b.rating||1000)-(a.rating||1000)).slice(0,20).map((u,i) => (
                                    <div key={u._id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-800/20 transition-colors">
                                        <div className={`w-8 text-center font-black text-sm ${i===0?'text-amber-400':i===1?'text-gray-300':i===2?'text-amber-700':'text-gray-600'}`}>
                                            {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/50 to-emerald-600/50 flex items-center justify-center text-xs font-black">
                                            {u.username?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 font-semibold">{u.username}</div>
                                        <div className="text-amber-400 font-mono font-bold">{u.rating||1000}</div>
                                        <div className="text-emerald-400 font-mono text-sm">{u.seasonScore||0} pts</div>
                                        <div className="text-xs text-gray-500">{u.stats?.wins||0}W / {u.stats?.losses||0}L</div>
                                        <WinRateBar wins={u.stats?.wins||0} total={u.stats?.matchesPlayed||0}/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════ ANALYTICS TAB ════════ */}
                {activeTab === 'analytics' && (
                    <AnalyticsTab
                        stats={stats}
                        users={users}
                        matches={matches}
                        problems={problems}
                        hourlyActivity={hourlyActivity}
                    />
                )}

                {/* ════════ SYSTEM TAB ════════ */}
                {activeTab === 'system' && (
                    <SystemTab health={systemHealth} users={users} matches={matches} problems={problems} adminUser={adminUser}/>
                )}

                {/* ════════ LIVE PRESENCE TAB ════════ */}
                {activeTab === 'live' && (
                    <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800/60 p-6 shadow-xl">
                        <LiveUsersTable />
                    </div>
                )}

            </main>

            {/* ── MODALS ─────────────────────────────────────────── */}
            {showAddProblem && (
                <ProblemModal onClose={() => setShowAddProblem(false)}
                    onSuccess={() => { setShowAddProblem(false); fetchAll(adminUser.username); }}
                    username={adminUser.username}
                    initialType={createProblemType}
                    key={`new-problem-${createProblemType}`}/>
            )}
            {editingProblem && (
                <ProblemModal problem={editingProblem} onClose={() => setEditingProblem(null)}
                    onSuccess={() => { setEditingProblem(null); fetchAll(adminUser.username); }}
                    username={adminUser.username}
                    initialType={problemView}/>
            )}
            {viewingUser && (
                <UserDetailModal user={viewingUser} matches={matches} onClose={() => setViewingUser(null)}/>
            )}
            {editingUser && (
                <EditUserModal user={editingUser} onClose={() => setEditingUser(null)}
                    onSave={handleUpdateUserStats}/>
            )}
            {viewingMatch && (
                <MatchDetailModal match={viewingMatch} onClose={() => setViewingMatch(null)}/>
            )}

            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: #0a0a0a; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: #3a3a3a; }
            `}</style>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// WIN RATE BAR
// ═══════════════════════════════════════════════════════════════
const WinRateBar = ({ wins, total }) => {
    const pct = total > 0 ? (wins / total) * 100 : 0;
    return (
        <div className="flex items-center gap-2 min-w-[80px]">
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accent to-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }}/>
            </div>
            <span className="text-xs text-gray-500 font-mono w-9 text-right">{pct.toFixed(0)}%</span>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════
const OverviewTab = ({ stats, users, matches, problems, recentActivity, hourlyActivity }) => {
    const totalMatches = matches.length;
    const completedMatches = matches.filter(m => m.status === 'completed').length;
    const todayMatches = matches.filter(m => (new Date() - new Date(m.createdAt)) < 86400000).length;
    const todayUsers = users.filter(u => (new Date() - new Date(u.createdAt)) < 86400000).length;
    const activeUsers = users.filter(u => u.stats?.matchesPlayed > 0).length;

    return (
        <div className="space-y-6">
            {/* Top stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<Users size={22} className="text-blue-400"/>} title="Total Users"
                    value={users.length} subtitle={`+${todayUsers} today`} color="blue" delta={12}/>
                <StatCard icon={<Trophy size={22} className="text-amber-400"/>} title="Total Matches"
                    value={totalMatches} subtitle={`+${todayMatches} today`} color="yellow" delta={8}/>
                <StatCard icon={<Code size={22} className="text-accent"/>} title="Problems"
                    value={problems.length} subtitle={`${problems.filter(p=>p.difficulty==='Hard').length} hard`} color="accent"/>
                <StatCard icon={<UserCheck size={22} className="text-purple-400"/>} title="Active Users"
                    value={activeUsers} subtitle={`${((activeUsers/users.length||0)*100).toFixed(0)}% conversion`} color="purple"/>
            </div>

            {/* Secondary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label:'Avg Rating',    val: users.length ? Math.round(users.reduce((a,u)=>a+(u.rating||1000),0)/users.length) : 0, icon:<Target size={18}/>, color:'text-amber-400' },
                    { label:'Completion Rate', val: totalMatches > 0 ? `${((completedMatches/totalMatches)*100).toFixed(1)}%` : '0%', icon:<CheckCircle size={18}/>, color:'text-emerald-400' },
                    { label:'Avg Matches/User', val: users.length ? (totalMatches/users.length).toFixed(1) : 0, icon:<Activity size={18}/>, color:'text-blue-400' },
                    { label:'Total Test Cases', val: problems.reduce((a,p)=>a+(p.totalTestCount||0),0), icon:<Database size={18}/>, color:'text-purple-400' },
                ].map(s => (
                    <div key={s.label} className="bg-gray-900/30 border border-gray-800/60 rounded-xl p-4 flex items-center gap-3">
                        <div className={`${s.color} p-2 bg-gray-800/50 rounded-lg`}>{s.icon}</div>
                        <div>
                            <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                            <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900/30 border border-gray-800/60 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-800/60 flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2"><Clock size={16} className="text-accent"/> Recent Matches</h3>
                        <span className="text-xs text-gray-600">Last 10</span>
                    </div>
                    <div className="divide-y divide-gray-800/40 max-h-[420px] overflow-y-auto custom-scroll">
                        {recentActivity.matches?.slice(0,10).map((m, i) => (
                            <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/20 transition-colors">
                                <div>
                                    <div className="text-sm font-semibold">
                                        <span className="text-white">{m.players?.[0]?.username||'?'}</span>
                                        <span className="text-gray-600 mx-2">vs</span>
                                        <span className="text-white">{m.players?.[1]?.username||'?'}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        Winner: <span className="text-amber-400 font-semibold">{m.winner || '—'}</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-600 text-right">
                                    <div>{fmtDate(m.createdAt)}</div>
                                    <div>{fmtTime(m.createdAt)}</div>
                                </div>
                            </div>
                        ))}
                        {!recentActivity.matches?.length && <EmptyState icon={Trophy} title="No matches yet"/>}
                    </div>
                </div>

                <div className="bg-gray-900/30 border border-gray-800/60 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-800/60 flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2"><Users size={16} className="text-blue-400"/> New Users</h3>
                        <span className="text-xs text-gray-600">Last 10</span>
                    </div>
                    <div className="divide-y divide-gray-800/40 max-h-[420px] overflow-y-auto custom-scroll">
                        {recentActivity.users?.slice(0,10).map((u, i) => (
                            <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-800/20 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/50 to-emerald-600/50 flex items-center justify-center text-xs font-black shrink-0">
                                    {u.username?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm">{u.username}</div>
                                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                                </div>
                                <div className="text-xs text-gray-600 text-right shrink-0">
                                    <div>{fmtDate(u.createdAt)}</div>
                                </div>
                            </div>
                        ))}
                        {!recentActivity.users?.length && <EmptyState icon={Users} title="No users yet"/>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// ANALYTICS TAB
// ═══════════════════════════════════════════════════════════════
const AnalyticsTab = ({ stats, users, matches, problems, hourlyActivity }) => {
    const maxHourly = Math.max(...hourlyActivity, 1);
    const peakHour  = hourlyActivity.indexOf(Math.max(...hourlyActivity));
    const totalHourly = hourlyActivity.reduce((a,b)=>a+b,0);

    // Match outcome distribution
    const p0Wins = matches.filter(m => m.winner === m.players?.[0]?.username).length;
    const p1Wins = matches.filter(m => m.winner === m.players?.[1]?.username).length;
    const draws  = matches.filter(m => m.winner === 'draw' || m.winner === 'tie').length;
    const other  = matches.length - p0Wins - p1Wins - draws;

    // Problem usage (approximate from matches)
    const probUsage = {};
    matches.forEach(m => {
        if (m.problem?.title) probUsage[m.problem.title] = (probUsage[m.problem.title]||0)+1;
    });
    const topProblems = Object.entries(probUsage).sort((a,b)=>b[1]-a[1]).slice(0,5);

    // Rating distribution
    const ratingBuckets = { '<800':0,'800-1000':0,'1000-1200':0,'1200-1400':0,'>1400':0 };
    users.forEach(u => {
        const r = u.rating || 1000;
        if      (r <  800)  ratingBuckets['<800']++;
        else if (r < 1000)  ratingBuckets['800-1000']++;
        else if (r < 1200)  ratingBuckets['1000-1200']++;
        else if (r < 1400)  ratingBuckets['1200-1400']++;
        else                ratingBuckets['>1400']++;
    });
    const maxBucket = Math.max(...Object.values(ratingBuckets), 1);

    return (
        <div className="space-y-6">
            {/* Hourly activity chart */}
            <div className="bg-gray-900/30 border border-gray-800/60 rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold flex items-center gap-2"><BarChart size={18} className="text-accent"/> Matches by Hour of Day</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Total: <span className="text-white font-bold">{totalHourly}</span></span>
                        <span>Peak: <span className="text-accent font-bold">{peakHour}:00 ({Math.max(...hourlyActivity)} matches)</span></span>
                    </div>
                </div>
                <div className="flex items-end gap-1 h-48">
                    {hourlyActivity.map((count, hour) => {
                        const h = (count / maxHourly) * 100;
                        const isPeak = hour === peakHour;
                        return (
                            <div key={hour} className="flex-1 flex flex-col items-center justify-end group relative">
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    {count}
                                </div>
                                <div className={`w-full rounded-t transition-all ${isPeak ? 'bg-accent' : 'bg-gray-700 group-hover:bg-gray-500'}`}
                                    style={{ height:`${Math.max(h, count>0?3:0)}%` }}/>
                                <div className="text-[9px] mt-1 text-gray-600 font-mono">{hour.toString().padStart(2,'0')}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Rating distribution */}
                <div className="bg-gray-900/30 border border-gray-800/60 rounded-xl p-5">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-sm"><BarChart2 size={16} className="text-blue-400"/> Rating Distribution</h3>
                    <div className="space-y-3">
                        {Object.entries(ratingBuckets).map(([range, count]) => {
                            const pct = (count / Math.max(users.length, 1)) * 100;
                            return (
                                <div key={range}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-400 font-mono">{range}</span>
                                        <span className="text-gray-300 font-bold">{count} <span className="text-gray-600">({pct.toFixed(0)}%)</span></span>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{width:`${pct}%`}}/>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Match outcomes */}
                <div className="bg-gray-900/30 border border-gray-800/60 rounded-xl p-5">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-sm"><PieChart size={16} className="text-purple-400"/> Match Outcomes</h3>
                    <div className="space-y-3">
                        {[
                            { label:'Player 1 Wins', val:p0Wins, color:'bg-emerald-500', textColor:'text-emerald-400' },
                            { label:'Player 2 Wins', val:p1Wins, color:'bg-blue-500',    textColor:'text-blue-400' },
                            { label:'Draws',         val:draws,  color:'bg-gray-500',    textColor:'text-gray-400' },
                            { label:'Other',         val:other,  color:'bg-red-500',     textColor:'text-red-400'  },
                        ].map(s => {
                            const pct = matches.length ? ((s.val/matches.length)*100).toFixed(1) : 0;
                            return (
                                <div key={s.label}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className={`${s.textColor} font-medium`}>{s.label}</span>
                                        <span className="text-gray-300 font-bold">{s.val} <span className="text-gray-600">({pct}%)</span></span>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${s.color} rounded-full`} style={{width:`${pct}%`}}/>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top problems */}
                <div className="bg-gray-900/30 border border-gray-800/60 rounded-xl p-5">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-sm"><TrendingUp size={16} className="text-amber-400"/> Most Played Problems</h3>
                    {topProblems.length > 0 ? (
                        <div className="space-y-3">
                            {topProblems.map(([title, count], i) => {
                                const pct = matches.length ? (count/matches.length)*100 : 0;
                                return (
                                    <div key={title}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-300 truncate mr-2">#{i+1} {title}</span>
                                            <span className="text-amber-400 font-bold shrink-0">{count}×</span>
                                        </div>
                                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{width:`${pct}%`}}/>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <EmptyState icon={Code} title="No match data yet"/>}
                </div>
            </div>

            {/* User growth over time */}
            <div className="bg-gray-900/30 border border-gray-800/60 rounded-xl p-6">
                <h3 className="font-bold mb-5 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-400"/> User Activity Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label:'Never played',   val: users.filter(u=>!u.stats?.matchesPlayed).length,       color:'text-red-400',     pct: users.length },
                        { label:'1–5 matches',    val: users.filter(u=>(u.stats?.matchesPlayed||0)>=1&&(u.stats?.matchesPlayed||0)<=5).length, color:'text-amber-400', pct: users.length },
                        { label:'6–20 matches',   val: users.filter(u=>(u.stats?.matchesPlayed||0)>=6&&(u.stats?.matchesPlayed||0)<=20).length, color:'text-blue-400', pct: users.length },
                        { label:'20+ matches',    val: users.filter(u=>(u.stats?.matchesPlayed||0)>20).length, color:'text-accent',    pct: users.length },
                    ].map(s => (
                        <div key={s.label} className="bg-gray-800/30 rounded-xl p-4 text-center">
                            <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                            <div className={`text-xs ${s.color} font-bold mt-1`}>{s.pct ? ((s.val/s.pct)*100).toFixed(0) : 0}%</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// SYSTEM TAB
// ═══════════════════════════════════════════════════════════════
const SystemTab = ({ health, users, matches, problems, adminUser }) => {
    const dbSizeEstimate = () => {
        const usersKB  = users.length  * 2;   // ~2KB per user
        const matchesKB = matches.length * 3;  // ~3KB per match
        const problemsKB = problems.length * 10; // ~10KB per problem
        const total = usersKB + matchesKB + problemsKB;
        return total > 1024 ? `~${(total/1024).toFixed(1)} MB` : `~${total} KB`;
    };

    return (
        <div className="space-y-6">
            {/* Health cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label:'API Server',    status: health?.status === 'ok', icon:<Server size={20}/>,  color:'green' },
                    { label:'Database',      status: true,                    icon:<Database size={20}/>, color:'green' },
                    { label:'Socket.io',     status: health?.activeSockets !== undefined, icon:<Wifi size={20}/>, color: health?.activeSockets !== undefined ? 'green':'red' },
                    { label:'Memory Cache',  status: true,                    icon:<HardDrive size={20}/>, color:'green' },
                ].map(s => (
                    <div key={s.label} className={`border rounded-xl p-5 flex items-center gap-3 ${s.status ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                        <div className={`p-2.5 rounded-lg ${s.status ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{s.icon}</div>
                        <div>
                            <div className={`font-bold ${s.status ? 'text-emerald-400' : 'text-red-400'}`}>{s.status ? 'Online' : 'Offline'}</div>
                            <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                        <div className={`ml-auto w-2 h-2 rounded-full ${s.status ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}/>
                    </div>
                ))}
            </div>

            {/* Live stats */}
            {health && (
                <div className="bg-gray-900/30 border border-gray-800/60 rounded-xl p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Activity size={18} className="text-accent"/> Live Server Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label:'Active Sockets',   val: health.activeSockets ?? '—',  icon:<Wifi size={16}/>,       color:'text-emerald-400' },
                            { label:'Active Rooms',      val: health.activeRooms ?? '—',    icon:<Layers size={16}/>,     color:'text-blue-400' },
                            { label:'Memory (MB)',        val: health.memoryMB ?? '—',       icon:<HardDrive size={16}/>,  color:'text-amber-400' },
                            { label:'Uptime (hrs)',       val: health.uptimeHours ?? '—',    icon:<Clock size={16}/>,      color:'text-purple-400' },
                        ].map(s => (
                            <div key={s.label} className="bg-gray-800/30 rounded-xl p-4 flex items-center gap-3">
                                <div className={`${s.color}`}>{s.icon}</div>
                                <div>
                                    <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                                    <div className="text-xs text-gray-500">{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Database overview */}
            <div className="bg-gray-900/30 border border-gray-800/60 rounded-xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Database size={18} className="text-blue-400"/> Database Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { collection:'Users',    count: users.length,    icon:<Users size={18}/>,  color:'blue' },
                        { collection:'Matches',  count: matches.length,  icon:<Trophy size={18}/>, color:'yellow' },
                        { collection:'Problems', count: problems.length, icon:<Code size={18}/>,   color:'green' },
                    ].map(d => (
                        <div key={d.collection} className="bg-gray-800/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-${d.color}-400`}>{d.icon}</span>
                                <span className="font-semibold text-sm">{d.collection}</span>
                            </div>
                            <div className={`text-2xl font-black text-${d.color}-400`}>{d.count}</div>
                            <div className="text-xs text-gray-600 mt-1">documents</div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-800/60 flex items-center justify-between text-sm text-gray-500">
                    <span>Estimated data size: <span className="text-white font-bold">{dbSizeEstimate()}</span></span>
                    <span>Admin: <span className="text-accent font-bold">{adminUser?.username}</span></span>
                </div>
            </div>

            {/* Quick info */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 flex items-start gap-3">
                <Info size={18} className="text-amber-400 shrink-0 mt-0.5"/>
                <div className="text-sm text-gray-400 space-y-1">
                    <p>System health data is fetched from <code className="text-accent bg-gray-800 px-1.5 py-0.5 rounded text-xs">/admin/system/health</code>. Ensure this endpoint is implemented in your backend.</p>
                    <p>Auto-refresh is active every <strong className="text-white">30 seconds</strong> for live stats. Use the Refresh button for full data reload.</p>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// ACTION CARD
// ═══════════════════════════════════════════════════════════════
const ActionCard = ({ icon, title, description, onClick, severity }) => {
    const styles = {
        low:    'bg-gray-800/40 border-gray-700/60 hover:border-gray-600',
        medium: 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50',
        high:   'bg-red-500/5 border-red-500/20 hover:border-red-500/50',
    };
    return (
        <button onClick={onClick} className={`w-full p-5 border rounded-xl text-left group transition-all hover:scale-[1.02] ${styles[severity]}`}>
            <div className="mb-3 group-hover:scale-110 transition-transform inline-block">{icon}</div>
            <div className="font-bold text-base mb-1.5 group-hover:text-white transition-colors">{title}</div>
            <div className="text-sm text-gray-500 leading-relaxed">{description}</div>
            {severity === 'high' && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                    <AlertTriangle size={12}/> Irreversible action
                </div>
            )}
        </button>
    );
};

// ═══════════════════════════════════════════════════════════════
// PROBLEM CARD
// ═══════════════════════════════════════════════════════════════
const ProblemCard = ({ problem, onEdit, onDelete }) => {
    const [expanded, setExpanded] = useState(false);
    const dc = DIFF_COLORS[problem.difficulty] || DIFF_COLORS.Easy;

    return (
        <div className="bg-gray-900/30 border border-gray-800/60 rounded-xl overflow-hidden hover:border-gray-700/60 transition-all">
            <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                        <h4 className="font-bold text-base">{problem.title}</h4>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${dc.bg} ${dc.text} ${dc.border}`}>
                            {problem.difficulty}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        <span className="font-mono text-gray-600">/{problem.slug}</span>
                        <span className="flex items-center gap-1"><Eye size={12} className="text-emerald-400"/> {problem.publicTestCount} public tests</span>
                        <span className="flex items-center gap-1"><Database size={12} className="text-blue-400"/> {problem.totalTestCount} total tests</span>
                        <span className="flex items-center gap-1"><Clock size={12} className="text-amber-400"/> {problem.timeLimit}ms</span>
                        <span className="flex items-center gap-1"><HardDrive size={12} className="text-purple-400"/> {problem.memoryLimit}MB</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setExpanded(!expanded)}
                        className="p-2 bg-gray-800/60 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-all">
                        {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </button>
                    <button onClick={onEdit}
                        className="p-2 bg-blue-500/15 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all">
                        <Edit size={16}/>
                    </button>
                    <button onClick={onDelete}
                        className="p-2 bg-red-500/15 text-red-400 rounded-lg hover:bg-red-500/30 transition-all">
                        <Trash2 size={16}/>
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-gray-800/60 bg-black/20 p-5 space-y-4">
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Description</div>
                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{problem.description}</p>
                    </div>
                    {problem.constraints?.length > 0 && (
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Constraints</div>
                            <ul className="space-y-1">
                                {problem.constraints.map((c,i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                                        <div className="w-1 h-1 bg-accent rounded-full mt-2 shrink-0"/>
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Test Cases ({problem.totalTestCount})</div>
                        <div className="space-y-2">
                            {problem.testCases?.slice(0,3).map((tc,i) => (
                                <div key={i} className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="bg-gray-900 rounded-lg p-2.5">
                                        <div className="text-gray-600 mb-1 font-semibold">Input:</div>
                                        <pre className="text-gray-300 font-mono overflow-auto">{tc.input}</pre>
                                    </div>
                                    <div className="bg-gray-900 rounded-lg p-2.5">
                                        <div className="text-gray-600 mb-1 font-semibold">Output:</div>
                                        <pre className="text-gray-300 font-mono overflow-auto">{tc.output}</pre>
                                    </div>
                                </div>
                            ))}
                            {problem.totalTestCount > 3 && (
                                <p className="text-xs text-gray-600 text-center">+{problem.totalTestCount - 3} more test cases</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// USER DETAIL MODAL
// ═══════════════════════════════════════════════════════════════
const UserDetailModal = ({ user, matches, onClose }) => {
    const userMatches = matches.filter(m =>
        m.players?.some(p => p.username === user.username)
    ).slice(0, 20);

    return (
        <Modal title={`User: ${user.username}`} onClose={onClose} size="lg">
            <div className="space-y-5">
                {/* Profile header */}
                <div className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-xl">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-emerald-600 flex items-center justify-center text-2xl font-black text-black">
                        {user.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-xl font-black">{user.username}</h3>
                        <p className="text-gray-500 text-sm">{user.email || 'No email'}</p>
                        <p className="text-gray-600 text-xs mt-0.5">Joined {fmtDate(user.createdAt)}</p>
                    </div>
                    {user.banned && <Badge color="red">Banned</Badge>}
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label:'Rating',     val: user.rating || 1000,           color:'text-amber-400' },
                        { label:'Season',     val: user.seasonScore || 0,          color:'text-emerald-400' },
                        { label:'Matches',    val: user.stats?.matchesPlayed || 0, color:'text-blue-400' },
                        { label:'Wins',       val: user.stats?.wins || 0,          color:'text-emerald-400' },
                        { label:'Losses',     val: user.stats?.losses || 0,        color:'text-red-400' },
                        { label:'Win Rate',   val: calcWinRate(user.stats?.wins||0, user.stats?.matchesPlayed||0), color:'text-accent' },
                    ].map(s => (
                        <div key={s.label} className="bg-gray-800/30 rounded-xl p-3 text-center">
                            <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                            <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Match history */}
                <div>
                    <h4 className="font-bold mb-3 text-sm text-gray-400 uppercase tracking-wider">Recent Matches ({userMatches.length})</h4>
                    {userMatches.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scroll">
                            {userMatches.map((m, i) => {
                                const opp = m.players?.find(p => p.username !== user.username)?.username || '?';
                                const won = m.winner === user.username;
                                const drew = m.winner === 'draw' || m.winner === 'tie';
                                return (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-black shrink-0 ${won?'bg-emerald-500/20 text-emerald-400':drew?'bg-gray-600/20 text-gray-400':'bg-red-500/20 text-red-400'}`}>
                                            {won?'W':drew?'D':'L'}
                                        </div>
                                        <div className="flex-1 text-sm">vs <span className="font-semibold">{opp}</span></div>
                                        <div className="text-xs text-gray-500">{m.problem?.title || '—'}</div>
                                        <div className="text-xs text-gray-600">{fmtDate(m.createdAt)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <p className="text-gray-600 text-sm text-center py-6">No matches found</p>}
                </div>
            </div>
        </Modal>
    );
};

// ═══════════════════════════════════════════════════════════════
// EDIT USER MODAL
// ═══════════════════════════════════════════════════════════════
const EditUserModal = ({ user, onClose, onSave }) => {
    const [form, setForm] = useState({
        rating: user.rating || 1000,
        seasonScore: user.seasonScore || 0,
        wins: user.stats?.wins || 0,
        losses: user.stats?.losses || 0,
        matchesPlayed: user.stats?.matchesPlayed || 0,
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await onSave(user._id, form);
        setSaving(false);
    };

    return (
        <Modal title={`Edit Stats: ${user.username}`} onClose={onClose}>
            <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-2 text-sm text-amber-400">
                    <AlertCircle size={16}/> Changes are immediately applied and visible on leaderboard.
                </div>
                {[
                    { label:'Rating (ELO)',    field:'rating',        min:0,    max:5000 },
                    { label:'Season Score',    field:'seasonScore',   min:0,    max:99999 },
                    { label:'Wins',            field:'wins',          min:0,    max:99999 },
                    { label:'Losses',          field:'losses',        min:0,    max:99999 },
                    { label:'Matches Played',  field:'matchesPlayed', min:0,    max:99999 },
                ].map(f => (
                    <div key={f.field}>
                        <label className="block text-sm font-semibold mb-1.5 text-gray-300">{f.label}</label>
                        <input type="number" min={f.min} max={f.max} value={form[f.field]}
                            onChange={e => setForm(prev => ({ ...prev, [f.field]: parseInt(e.target.value)||0 }))}
                            className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 font-mono transition-all"/>
                    </div>
                ))}
                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-all">Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                        className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent/80 text-black rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                        {saving ? <><Spinner size={4}/> Saving...</> : <><Save size={16}/> Save Changes</>}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// ═══════════════════════════════════════════════════════════════
// MATCH DETAIL MODAL
// ═══════════════════════════════════════════════════════════════
const MatchDetailModal = ({ match, onClose }) => {
    const p0 = match.players?.[0]?.username || '?';
    const p1 = match.players?.[1]?.username || '?';
    const isP0Winner = match.winner === p0;
    const isP1Winner = match.winner === p1;
    const isDraw = match.winner === 'draw' || match.winner === 'tie';

    return (
        <Modal title="Match Details" onClose={onClose}>
            <div className="space-y-4">
                {/* Players */}
                <div className="grid grid-cols-3 gap-3 items-center">
                    <div className={`text-center p-3 rounded-xl ${isP0Winner ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-gray-800/30'}`}>
                        <div className="text-lg font-black">{p0}</div>
                        {isP0Winner && <div className="text-xs text-amber-400 mt-1 font-bold flex items-center justify-center gap-1"><Trophy size={12}/> Winner</div>}
                    </div>
                    <div className="text-center">
                        <div className="text-gray-600 font-bold text-sm">VS</div>
                        <Badge color={isDraw?'gray':isP0Winner||isP1Winner?'yellow':'gray'}>
                            {isDraw ? 'Draw' : match.status || '—'}
                        </Badge>
                    </div>
                    <div className={`text-center p-3 rounded-xl ${isP1Winner ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-gray-800/30'}`}>
                        <div className="text-lg font-black">{p1}</div>
                        {isP1Winner && <div className="text-xs text-amber-400 mt-1 font-bold flex items-center justify-center gap-1"><Trophy size={12}/> Winner</div>}
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-2.5">
                    {[
                        { label:'Room ID',   val: match.roomId || '—' },
                        { label:'Problem',   val: match.problem?.title || '—' },
                        { label:'Status',    val: match.status || '—' },
                        { label:'Winner',    val: isDraw ? 'Draw' : match.winner || '—' },
                        { label:'Started',   val: fmtDateTime(match.createdAt) },
                    ].map(d => (
                        <div key={d.label} className="flex items-center justify-between py-2 border-b border-gray-800/60 last:border-0">
                            <span className="text-sm text-gray-500">{d.label}</span>
                            <span className="text-sm font-semibold text-right max-w-[60%] break-all">{d.val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

// ═══════════════════════════════════════════════════════════════
// GENERIC MODAL WRAPPER
// ═══════════════════════════════════════════════════════════════
const Modal = ({ title, onClose, children, size = 'md' }) => {
    const sizes = { sm:'max-w-md', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' };
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className={`bg-[#111] border border-gray-800 rounded-2xl w-full ${sizes[size]} shadow-2xl my-8`}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <h2 className="text-lg font-bold">{title}</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg transition-all text-gray-400 hover:text-white">
                        <X size={20}/>
                    </button>
                </div>
                <div className="p-6 max-h-[80vh] overflow-y-auto custom-scroll">
                    {children}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// PROBLEM MODAL (ADD / EDIT)
// ═══════════════════════════════════════════════════════════════
const ProblemModal = ({ problem, onClose, onSuccess, username, initialType = 'battle' }) => {
    const isEditing = !!problem;

    const [formData, setFormData] = useState({
        title:           problem?.title || '',
        slug:            problem?.slug  || '',
        description:     problem?.description || '',
        difficulty:      problem?.difficulty  || 'Easy',
        type:            problem?.type || initialType,
        campaignRegion:  problem?.campaignRegion || '',
        campaignNodeId:  problem?.campaignNodeId || '',
        constraints:     problem?.constraints || [''],
        timeLimit:       problem?.timeLimit   || 5000,
        memoryLimit:     problem?.memoryLimit || 512,
        goldenSolution:  problem?.goldenSolution || '',
        starterCode:     problem?.starterCode || {
            javascript: `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\n\nfunction solve(input) {\n    // Write your solution here\n}\n\nconsole.log(solve(input));`,
            python:     `import sys\n\ndef solve():\n    data = sys.stdin.read().split()\n    # Write your solution here\n\nsolve()`,
            cpp:        `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // Write your solution here\n    return 0;\n}`,
            java:       `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your solution here\n    }\n}`,
        },
        testCases: problem?.testCases || [{ input:'', output:'', isPublic:true }],
    });

    const [submitting, setSubmitting] = useState(false);
    const [activeCodeTab, setActiveCodeTab] = useState('javascript');

    const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    useEffect(() => {
        if (problem) return;

        setFormData((prev) => ({
            ...prev,
            type: initialType,
            campaignRegion: initialType === 'campaign' ? prev.campaignRegion : '',
            campaignNodeId: initialType === 'campaign' ? prev.campaignNodeId : '',
        }));
    }, [initialType, problem]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.slug || !formData.description) {
            toast.error('Title, slug, and description are required'); return;
        }
        if (formData.type === 'campaign' && !formData.campaignRegion) {
            toast.error('Campaign problems need a region number'); return;
        }
        if (formData.type === 'campaign' && !String(formData.campaignNodeId).trim()) {
            toast.error('Campaign problems need a target node ID'); return;
        }
        if (!formData.testCases[0]?.input) {
            toast.error('At least one test case with input is required'); return;
        }
        setSubmitting(true);
        try {
            const payload = {
                username,
                ...formData,
                campaignRegion: formData.type === 'campaign' ? Number(formData.campaignRegion) : undefined,
                campaignNodeId: formData.type === 'campaign' ? formData.campaignNodeId.trim() : undefined,
                constraints: formData.constraints.filter(c=>c.trim()),
            };
            if (isEditing) {
                await api.post(`/admin/problems/${problem._id}/update`, payload);
                toast.success('Problem updated!');
            } else {
                await api.post('/admin/problems/create', payload);
                toast.success('Problem created!');
            }
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save problem');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-[#0f0f0f] border border-gray-800 rounded-2xl w-full max-w-5xl my-8 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-[#0f0f0f] z-10 rounded-t-2xl">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        {isEditing ? <><Edit size={20} className="text-blue-400"/> Edit Problem</> : <><Plus size={20} className="text-accent"/> New Problem</>}
                    </h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg transition-all text-gray-400 hover:text-white"><X size={20}/></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scroll">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur-xl">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-black text-white">Problem Type</p>
                                <p className="text-xs text-gray-500">Choose whether this problem feeds live 1v1 battles or the campaign map.</p>
                            </div>
                            <Badge color={formData.type === 'campaign' ? 'purple' : 'green'}>
                                {PROBLEM_TYPE_META[formData.type]?.shortLabel || 'Battle Arena'}
                            </Badge>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                            {Object.entries(PROBLEM_TYPE_META).map(([key, meta]) => {
                                const isActive = formData.type === key;

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setFormData((prev) => ({
                                            ...prev,
                                            type: key,
                                            campaignRegion: key === 'campaign' ? prev.campaignRegion : '',
                                            campaignNodeId: key === 'campaign' ? prev.campaignNodeId : '',
                                        }))}
                                        className={`rounded-xl border px-4 py-3 text-left transition-all ${
                                            isActive
                                                ? 'border-accent/40 bg-accent/10'
                                                : 'border-gray-800 bg-black/10 hover:border-gray-700 hover:bg-white/[0.03]'
                                        }`}
                                    >
                                        <div className="text-sm font-bold text-white">{meta.shortLabel}</div>
                                        <div className="mt-1 text-xs leading-relaxed text-gray-500">{meta.description}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Basic info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-gray-300">Title <span className="text-red-400">*</span></label>
                            <input value={formData.title} onChange={e=>set('title',e.target.value)} required
                                className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 transition-all"
                                placeholder="Two Sum"/>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-gray-300">Slug <span className="text-red-400">*</span></label>
                            <input value={formData.slug} onChange={e=>set('slug',e.target.value.toLowerCase().replace(/\s+/g,'-'))}
                                required disabled={isEditing}
                                className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 font-mono transition-all disabled:opacity-50"
                                placeholder="two-sum"/>
                            {isEditing && <p className="text-xs text-gray-600 mt-1">Slug cannot be changed after creation</p>}
                        </div>
                    </div>

                    {formData.type === 'campaign' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-gray-300">Region Number <span className="text-red-400">*</span></label>
                                <select
                                    value={formData.campaignRegion}
                                    onChange={e => set('campaignRegion', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 transition-all cursor-pointer"
                                    required
                                >
                                    <option value="">Select Region</option>
                                    {CAMPAIGN_REGIONS.map(r => (
                                        <option key={r.id} value={r.id}>Region {r.id}: {r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1.5 text-gray-300">Target Node ID <span className="text-red-400">*</span></label>
                                <input
                                    value={formData.campaignNodeId}
                                    onChange={e => set('campaignNodeId', e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 transition-all font-mono"
                                    placeholder="region-1-node-01"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-gray-300">Description <span className="text-red-400">*</span></label>
                        <textarea value={formData.description} onChange={e=>set('description',e.target.value)} required
                            className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 min-h-[160px] transition-all resize-y"
                            placeholder="Describe the problem clearly with examples..."/>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label:'Difficulty', field:'difficulty', type:'select', options:['Easy','Medium','Hard'] },
                            { label:'Time Limit (ms)', field:'timeLimit', type:'number', min:100, max:30000 },
                            { label:'Memory Limit (MB)', field:'memoryLimit', type:'number', min:16, max:2048 },
                        ].map(f => (
                            <div key={f.field}>
                                <label className="block text-sm font-semibold mb-1.5 text-gray-300">{f.label}</label>
                                {f.type === 'select' ? (
                                    <select value={formData[f.field]} onChange={e=>set(f.field,e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 cursor-pointer transition-all">
                                        {f.options.map(o => <option key={o}>{o}</option>)}
                                    </select>
                                ) : (
                                    <input type="number" min={f.min} max={f.max} value={formData[f.field]}
                                        onChange={e=>set(f.field,parseInt(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 transition-all"/>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Golden solution */}
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-gray-300 flex items-center gap-1.5">
                            <Zap size={16} className="text-amber-400"/> Golden Solution (JavaScript) <span className="text-red-400">*</span>
                        </label>
                        <p className="text-xs text-gray-600 mb-2">Reference solution used to validate test cases and judge submissions. Should be a function: <code className="text-accent bg-gray-800 px-1 rounded">(input) =&gt; output_string</code></p>
                        <textarea value={formData.goldenSolution} onChange={e=>set('goldenSolution',e.target.value)} required
                            className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 font-mono text-sm min-h-[200px] transition-all resize-y"
                            placeholder={`(input) => {\n    const [a, b] = input.trim().split(' ').map(Number);\n    return String(a + b);\n}`}/>
                    </div>

                    {/* Constraints */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-gray-300">Constraints</label>
                            <button type="button" onClick={() => set('constraints',[...formData.constraints,''])}
                                className="text-xs px-3 py-1 bg-accent text-black rounded-lg hover:bg-accent/80 font-bold transition-all">+ Add</button>
                        </div>
                        <div className="space-y-2">
                            {formData.constraints.map((c,i) => (
                                <div key={i} className="flex gap-2">
                                    <input value={c} onChange={e=>{const nc=[...formData.constraints];nc[i]=e.target.value;set('constraints',nc);}}
                                        className="flex-1 px-4 py-2 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 text-sm transition-all"
                                        placeholder="1 ≤ n ≤ 10^5"/>
                                    <button type="button" onClick={()=>set('constraints',formData.constraints.filter((_,j)=>j!==i))}
                                        className="p-2 bg-red-500/15 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"><X size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Test cases */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-gray-300">Test Cases <span className="text-red-400">*</span></label>
                            <button type="button" onClick={()=>set('testCases',[...formData.testCases,{input:'',output:'',isPublic:false}])}
                                className="text-xs px-3 py-1 bg-accent text-black rounded-lg hover:bg-accent/80 font-bold transition-all">+ Add Test Case</button>
                        </div>
                        <div className="space-y-3">
                            {formData.testCases.map((tc,i) => (
                                <div key={i} className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Test Case {i+1}</span>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={()=>{const nt=[...formData.testCases];nt[i]={...nt[i],isPublic:!nt[i].isPublic};set('testCases',nt);}}
                                                className={`flex items-center gap-1 text-xs px-3 py-1 rounded-lg font-bold transition-all ${tc.isPublic?'bg-emerald-500/20 text-emerald-400':'bg-gray-800 text-gray-500'}`}>
                                                {tc.isPublic ? <Eye size={12}/> : <EyeOff size={12}/>} {tc.isPublic ? 'Public' : 'Hidden'}
                                            </button>
                                            {formData.testCases.length > 1 && (
                                                <button type="button" onClick={()=>set('testCases',formData.testCases.filter((_,j)=>j!==i))}
                                                    className="p-1.5 bg-red-500/15 text-red-400 rounded hover:bg-red-500/30 transition-all"><Trash2 size={14}/></button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['input','output'].map(field => (
                                            <div key={field}>
                                                <label className="block text-xs text-gray-600 mb-1 capitalize">{field}</label>
                                                <textarea value={tc[field]}
                                                    onChange={e=>{const nt=[...formData.testCases];nt[i]={...nt[i],[field]:e.target.value};set('testCases',nt);}}
                                                    className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg font-mono text-xs focus:outline-none focus:border-accent/60 min-h-[80px] resize-y transition-all"
                                                    placeholder={field === 'input' ? '5 3' : '8'} required/>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Starter code */}
                    <details className="bg-gray-900/30 border border-gray-800/60 rounded-xl overflow-hidden">
                        <summary className="px-5 py-3.5 cursor-pointer font-semibold text-sm flex items-center gap-2 hover:bg-gray-800/30 transition-all">
                            <Code size={16} className="text-accent"/> Starter Code (Optional)
                        </summary>
                        <div className="border-t border-gray-800/60">
                            <div className="flex border-b border-gray-800/60">
                                {Object.keys(formData.starterCode).map(lang => (
                                    <button key={lang} type="button" onClick={() => setActiveCodeTab(lang)}
                                        className={`px-4 py-2 text-xs font-semibold transition-all ${activeCodeTab===lang?'text-accent border-b-2 border-accent bg-accent/5':'text-gray-500 hover:text-gray-300'}`}>
                                        {lang}
                                    </button>
                                ))}
                            </div>
                            <div className="p-4">
                                <textarea value={formData.starterCode[activeCodeTab]}
                                    onChange={e=>set('starterCode',{...formData.starterCode,[activeCodeTab]:e.target.value})}
                                    className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg font-mono text-xs focus:outline-none focus:border-accent/60 min-h-[180px] resize-y transition-all"/>
                            </div>
                        </div>
                    </details>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2 border-t border-gray-800/60">
                        <button type="button" onClick={onClose} disabled={submitting}
                            className="flex-1 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-all">Cancel</button>
                        <button type="submit" disabled={submitting}
                            className="flex-1 px-5 py-2.5 bg-accent hover:bg-accent/80 text-black rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                            {submitting ? <><Spinner size={4}/> {isEditing ? 'Updating...' : 'Creating...'}</> : <><Save size={16}/> {isEditing ? 'Update Problem' : 'Create Problem'}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminDashboard;
// V 1.5
