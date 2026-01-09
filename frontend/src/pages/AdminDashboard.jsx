// ========================================================================
// FILE: frontend/src/pages/AdminDashboard.jsx
// COMPLETE ENHANCED VERSION WITH ALL FIXES
// ========================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Trophy, TrendingUp, Activity, Clock, AlertTriangle,
    RefreshCw, Trash2, Edit, Search, BarChart, Shield, LogOut,
    Code, Plus, X, Eye, EyeOff, Save, ChevronDown, ChevronUp,
    CheckCircle, XCircle, Zap, Database, Calendar, Filter
} from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [problems, setProblems] = useState([]);
    const [recentActivity, setRecentActivity] = useState({ matches: [], users: [] });
    const [hourlyActivity, setHourlyActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddProblem, setShowAddProblem] = useState(false);
    const [editingProblem, setEditingProblem] = useState(null);
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    
    const navigate = useNavigate();

    // ===== AUTH CHECK =====
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('codearena_user'));
        if (!storedUser) {
            navigate('/login');
            return;
        }

        const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
        if (storedUser.username !== adminUsername) {
            toast.error('Access Denied: Admin privileges required');
            navigate('/dashboard');
            return;
        }

        setUser(storedUser);
        fetchDashboardData(storedUser.username);
    }, [navigate]);

    // ===== FETCH DATA =====
    const fetchDashboardData = async (username) => {
        setLoading(true);
        try {
            const [statsRes, usersRes, activityRes, hourlyRes, problemsRes] = await Promise.all([
                api.post('/admin/stats', { username }),
                api.post('/admin/users', { username, limit: 100 }),
                api.post('/admin/activity/recent', { username }),
                api.post('/admin/activity/hourly', { username }),
                api.post('/admin/problems', { username })
            ]);

            setStats(statsRes.data);
            setUsers(usersRes.data.users);
            setRecentActivity(activityRes.data);
            setHourlyActivity(hourlyRes.data.hourlyActivity);
            setProblems(problemsRes.data.problems);

        } catch (error) {
            console.error('Failed to fetch admin data:', error);
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    // ===== LEADERBOARD ACTIONS =====
    const handleResetSeason = async () => {
        if (!confirm('⚠️ Reset ALL season scores to 0? This cannot be undone!')) return;

        try {
            const res = await api.post('/admin/leaderboard/reset-season', { 
                username: user.username 
            });
            toast.success(res.data.message);
            fetchDashboardData(user.username);
        } catch (error) {
            toast.error('Failed to reset season scores');
        }
    };

    const handleResetAll = async () => {
        if (!confirm('⚠️⚠️ RESET ALL STATS (ELO, Season, Wins, Losses)? This CANNOT be undone!')) return;
        if (!confirm('Are you ABSOLUTELY sure? Type YES in your mind and click OK')) return;

        try {
            const res = await api.post('/admin/leaderboard/reset-all', { 
                username: user.username 
            });
            toast.success(res.data.message);
            fetchDashboardData(user.username);
        } catch (error) {
            toast.error('Failed to reset all stats');
        }
    };

    const handleClearMatches = async () => {
        if (!confirm('⚠️ Delete ALL match history? This cannot be undone!')) return;

        try {
            const res = await api.post('/admin/matches/clear', { 
                username: user.username 
            });
            toast.success(res.data.message);
            fetchDashboardData(user.username);
        } catch (error) {
            toast.error('Failed to clear match history');
        }
    };

    // ===== USER ACTIONS =====
    const handleDeleteUser = async (userId, username) => {
        if (!confirm(`Delete user "${username}" and all their matches?`)) return;

        try {
            await api.post(`/admin/users/${userId}/delete`, { 
                username: user.username 
            });
            toast.success('User deleted successfully');
            fetchDashboardData(user.username);
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    // ===== PROBLEM ACTIONS =====
    const handleDeleteProblem = async (problemId, title) => {
        if (!confirm(`Delete problem "${title}"? This will affect ongoing matches!`)) return;

        try {
            await api.post(`/admin/problems/${problemId}/delete`, { 
                username: user.username 
            });
            toast.success('Problem deleted successfully');
            fetchDashboardData(user.username);
        } catch (error) {
            toast.error('Failed to delete problem');
        }
    };

    const handleEditProblem = (problem) => {
        setEditingProblem(problem);
    };

    // ===== FILTERING =====
    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredProblems = problems.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.slug.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDifficulty = filterDifficulty === 'all' || p.difficulty === filterDifficulty;
        return matchesSearch && matchesDifficulty;
    });

    // ===== RENDER =====
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent mx-auto mb-4"></div>
                    <p className="text-gray-400 text-lg">Loading Admin Control Panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* HEADER */}
            <div className="bg-gradient-to-r from-[#111] to-[#1a1a1a] border-b border-gray-800 sticky top-0 z-50 backdrop-blur-lg bg-opacity-95 shadow-2xl">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 flex items-center justify-center shadow-lg">
                            <Shield size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                                Admin Control Center
                            </h1>
                            <p className="text-sm text-gray-400 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                Logged in as <span className="font-bold text-accent">{user?.username}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchDashboardData(user.username)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all hover:scale-105"
                        >
                            <RefreshCw size={18} />
                            Refresh
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 rounded-lg hover:from-red-500 hover:to-red-400 transition-all hover:scale-105 font-bold"
                        >
                            <LogOut size={18} />
                            Exit Admin
                        </button>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className="bg-[#111] border-b border-gray-800 sticky top-[73px] z-40 backdrop-blur-lg bg-opacity-95">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                        {[
                            { id: 'overview', icon: Activity, label: 'Overview' },
                            { id: 'users', icon: Users, label: 'Users' },
                            { id: 'problems', icon: Code, label: 'Problems' },
                            { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
                            { id: 'analytics', icon: BarChart, label: 'Analytics' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-accent text-accent bg-accent/10'
                                        : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                                }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                
                {/* ===== OVERVIEW TAB ===== */}
                {activeTab === 'overview' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                icon={<Users className="text-blue-400" size={28} />}
                                title="Total Users"
                                value={stats?.users.total || 0}
                                subtitle={`+${stats?.users.newToday || 0} today`}
                                trend="+12%"
                                color="blue"
                            />
                            <StatCard
                                icon={<Trophy className="text-yellow-400" size={28} />}
                                title="Total Matches"
                                value={stats?.matches.total || 0}
                                subtitle={`+${stats?.matches.today || 0} today`}
                                trend="+8%"
                                color="yellow"
                            />
                            <StatCard
                                icon={<TrendingUp className="text-green-400" size={28} />}
                                title="Avg Matches/User"
                                value={(stats?.matches.avgPerUser || 0).toFixed(1)}
                                subtitle="per user"
                                trend="+5%"
                                color="green"
                            />
                            <StatCard
                                icon={<Zap className="text-purple-400" size={28} />}
                                title="Most Active"
                                value={stats?.players.mostActive?.username || 'N/A'}
                                subtitle={`${stats?.players.mostActive?.stats?.matchesPlayed || 0} matches`}
                                color="purple"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Matches */}
                            <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6 shadow-xl">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Clock className="text-accent" size={24} />
                                    Recent Matches
                                    <span className="ml-auto text-sm font-normal text-gray-500">
                                        Last 10
                                    </span>
                                </h3>
                                <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {recentActivity.matches.slice(0, 10).map((match, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg hover:bg-gray-900 transition-all border border-gray-900 hover:border-gray-800 group">
                                            <div className="flex-1">
                                                <div className="font-mono text-sm flex items-center gap-2">
                                                    <span className="font-bold text-white group-hover:text-accent transition-colors">
                                                        {match.players[0]?.username}
                                                    </span>
                                                    <span className="text-gray-600">vs</span>
                                                    <span className="font-bold text-white group-hover:text-accent transition-colors">
                                                        {match.players[1]?.username}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                    <Trophy size={12} className="text-yellow-500" />
                                                    Winner: <span className="text-accent font-bold">{match.winner}</span>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 flex flex-col items-end gap-1">
                                                <Calendar size={12} className="inline mr-1" />
                                                {new Date(match.createdAt).toLocaleDateString()}
                                                <Clock size={12} className="inline mr-1" />
                                                {new Date(match.createdAt).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Users */}
                            <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6 shadow-xl">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Users className="text-blue-400" size={24} />
                                    New Users
                                    <span className="ml-auto text-sm font-normal text-gray-500">
                                        Last 10
                                    </span>
                                </h3>
                                <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {recentActivity.users.slice(0, 10).map((u, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg hover:bg-gray-900 transition-all border border-gray-900 hover:border-gray-800 group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-green-400 flex items-center justify-center font-bold text-black">
                                                    {u.username[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold group-hover:text-accent transition-colors">
                                                        {u.username}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{u.email}</div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 text-right">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Clock size={12} />
                                                    {new Date(u.createdAt).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ===== USERS TAB ===== */}
                {activeTab === 'users' && (
                    <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                                <Users className="text-blue-400" />
                                User Management
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    ({filteredUsers.length} users)
                                </span>
                            </h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent w-80"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-800">
                            <table className="w-full">
                                <thead className="bg-[#0a0a0a]">
                                    <tr className="border-b border-gray-800">
                                        <th className="text-left p-4 text-xs font-bold uppercase text-gray-400">User</th>
                                        <th className="text-left p-4 text-xs font-bold uppercase text-gray-400">Rating</th>
                                        <th className="text-left p-4 text-xs font-bold uppercase text-gray-400">Season</th>
                                        <th className="text-left p-4 text-xs font-bold uppercase text-gray-400">W/L</th>
                                        <th className="text-left p-4 text-xs font-bold uppercase text-gray-400">Matches</th>
                                        <th className="text-left p-4 text-xs font-bold uppercase text-gray-400">Joined</th>
                                        <th className="text-right p-4 text-xs font-bold uppercase text-gray-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u, idx) => (
                                        <tr key={u._id} className={`border-b border-gray-900 hover:bg-gray-900/50 transition-all ${idx % 2 === 0 ? 'bg-[#0a0a0a]/50' : ''}`}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-green-400 flex items-center justify-center font-bold text-black">
                                                        {u.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">{u.username}</div>
                                                        <div className="text-xs text-gray-500">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono font-bold text-yellow-400">
                                                    {u.rating || 1000}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono font-bold text-green-400">
                                                    {u.seasonScore || 0}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-green-400 font-bold">{u.stats?.wins || 0}</span>
                                                    <span className="text-gray-600">/</span>
                                                    <span className="text-red-400 font-bold">{u.stats?.losses || 0}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono">{u.stats?.matchesPlayed || 0}</span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteUser(u._id, u.username)}
                                                    className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all inline-flex items-center gap-2"
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ===== PROBLEMS TAB ===== */}
                {activeTab === 'problems' && (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                    <Code className="text-accent" size={28} />
                                    Problem Management
                                    <span className="text-sm font-normal text-gray-500 ml-2">
                                        ({filteredProblems.length} problems)
                                    </span>
                                </h3>
                                <button
                                    onClick={() => setShowAddProblem(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-green-400 text-black rounded-lg hover:from-green-400 hover:to-accent transition-all font-bold shadow-lg hover:shadow-accent/50 hover:scale-105"
                                >
                                    <Plus size={20} />
                                    Add Problem
                                </button>
                            </div>

                            <div className="flex gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search problems..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent"
                                    />
                                </div>
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <select
                                        value={filterDifficulty}
                                        onChange={(e) => setFilterDifficulty(e.target.value)}
                                        className="pl-10 pr-8 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent appearance-none cursor-pointer"
                                    >
                                        <option value="all">All Difficulties</option>
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {filteredProblems.map((p) => (
                                    <ProblemCard
                                        key={p._id}
                                        problem={p}
                                        onEdit={() => handleEditProblem(p)}
                                        onDelete={() => handleDeleteProblem(p._id, p.title)}
                                    />
                                ))}
                                {filteredProblems.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        <Code size={48} className="mx-auto mb-4 opacity-50" />
                                        <p className="text-lg">No problems found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== LEADERBOARD TAB ===== */}
                {activeTab === 'leaderboard' && (
                    <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6 shadow-xl">
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Trophy className="text-yellow-400" />
                            Leaderboard Management
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ActionCard
                                icon={<RefreshCw className="text-orange-400" size={32} />}
                                title="Reset Season Scores"
                                description="Set all seasonScore to 0 (keeps ELO & stats intact)"
                                onClick={handleResetSeason}
                                color="orange"
                                severity="medium"
                            />
                            <ActionCard
                                icon={<AlertTriangle className="text-red-400" size={32} />}
                                title="Reset All Stats"
                                description="Reset ELO, season, wins, losses (⚠️ Irreversible!)"
                                onClick={handleResetAll}
                                color="red"
                                severity="high"
                            />
                            <ActionCard
                                icon={<Trash2 className="text-purple-400" size={32} />}
                                title="Clear Match History"
                                description="Delete all match records (⚠️ Irreversible!)"
                                onClick={handleClearMatches}
                                color="purple"
                                severity="high"
                            />
                        </div>
                    </div>
                )}

                {/* ===== ANALYTICS TAB ===== */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6 shadow-xl">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <BarChart className="text-accent" />
                                Activity by Hour
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    (Total Matches: {hourlyActivity.reduce((a, b) => a + b, 0)})
                                </span>
                            </h3>
                            <div className="flex items-end justify-between gap-2 h-80">
                                {hourlyActivity.map((count, hour) => {
                                    const maxCount = Math.max(...hourlyActivity, 1);
                                    const height = (count / maxCount) * 100;
                                    return (
                                        <div key={hour} className="flex-1 flex flex-col items-center justify-end group">
                                            <div className="relative w-full">
                                                <div
                                                    className="w-full bg-gradient-to-t from-accent to-green-400 rounded-t transition-all hover:from-green-400 hover:to-accent cursor-pointer"
                                                    style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                                                >
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                        {count} matches
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] mt-2 text-gray-500 group-hover:text-accent transition-colors font-mono">
                                                {hour.toString().padStart(2, '0')}:00
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Additional Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <Database className="text-blue-400" size={24} />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Total Problems</div>
                                        <div className="text-2xl font-bold">{problems.length}</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-400">Easy</span>
                                        <span className="font-bold">{problems.filter(p => p.difficulty === 'Easy').length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-yellow-400">Medium</span>
                                        <span className="font-bold">{problems.filter(p => p.difficulty === 'Medium').length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-400">Hard</span>
                                        <span className="font-bold">{problems.filter(p => p.difficulty === 'Hard').length}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle className="text-green-400" size={24} />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Active Users</div>
                                        <div className="text-2xl font-bold">
                                            {users.filter(u => u.stats?.matchesPlayed > 0).length}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {((users.filter(u => u.stats?.matchesPlayed > 0).length / users.length) * 100 || 0).toFixed(1)}% of total users
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-xl border border-gray-800 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                        <Activity className="text-purple-400" size={24} />
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Peak Hour</div>
                                        <div className="text-2xl font-bold">
                                            {hourlyActivity.indexOf(Math.max(...hourlyActivity))}:00
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {Math.max(...hourlyActivity)} matches
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            {showAddProblem && (
                <ProblemModal
                    onClose={() => setShowAddProblem(false)}
                    onSuccess={() => {
                        setShowAddProblem(false);
                        fetchDashboardData(user.username);
                    }}
                    username={user.username}
                />
            )}

            {editingProblem && (
                <ProblemModal
                    problem={editingProblem}
                    onClose={() => setEditingProblem(null)}
                    onSuccess={() => {
                        setEditingProblem(null);
                        fetchDashboardData(user.username);
                    }}
                    username={user.username}
                />
            )}
        </div>
    );
};

// ===== UTILITY COMPONENTS =====

const StatCard = ({ icon, title, value, subtitle, trend, color }) => (
    <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-all hover:scale-105 shadow-lg">
        <div className="flex items-center justify-between mb-3">
            <div className={`p-3 rounded-xl bg-${color}-500/20`}>
                {icon}
            </div>
            {trend && (
                <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                    <TrendingUp size={12} />
                    {trend}
                </span>
            )}
        </div>
        <div className="text-sm text-gray-500 mb-1">{title}</div>
        <div className="text-3xl font-black mb-1">{value}</div>
        <div className="text-sm text-gray-500">{subtitle}</div>
    </div>
);

const ActionCard = ({ icon, title, description, onClick, color, severity }) => (
    <button
        onClick={onClick}
        className={`p-6 bg-${color}-500/10 border-2 border-${color}-500/20 rounded-xl hover:border-${color}-500 transition-all text-left group hover:scale-105 relative overflow-hidden`}
    >
        {severity === 'high' && (
            <div className="absolute top-2 right-2">
                <AlertTriangle size={16} className="text-red-400 animate-pulse" />
            </div>
        )}
        <div className="mb-4 group-hover:scale-110 transition-transform">{icon}</div>
        <div className="font-bold text-lg mb-2 group-hover:text-white transition-colors">{title}</div>
        <div className="text-sm text-gray-400 leading-relaxed">{description}</div>
    </button>
);

const ProblemCard = ({ problem, onEdit, onDelete }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-[#0a0a0a] rounded-lg border border-gray-900 hover:border-gray-800 transition-all group overflow-hidden">
            <div className="flex items-center justify-between p-5">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-lg group-hover:text-accent transition-colors">
                            {problem.title}
                        </h4>
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                            problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                            problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                        }`}>
                            {problem.difficulty}
                        </span>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-4">
                        <span className="font-mono">/{problem.slug}</span>
                        <span className="flex items-center gap-1">
                            <CheckCircle size={14} className="text-green-400" />
                            {problem.publicTestCount} public
                        </span>
                        <span className="flex items-center gap-1">
                            <Database size={14} className="text-blue-400" />
                            {problem.totalTestCount} total tests
                        </span>
                        <span className="flex items-center gap-1">
                            <Code size={14} className="text-purple-400" />
                            {problem.constraints?.length || 0} constraints
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="px-3 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-all"
                    >
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button
                        onClick={onEdit}
                        className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            
            {expanded && (
                <div className="border-t border-gray-900 p-5 bg-black/30 space-y-4">
                    <div>
                        <div className="text-xs font-bold uppercase text-gray-500 mb-2">Description</div>
                        <div className="text-sm text-gray-300 whitespace-pre-wrap">{problem.description}</div>
                    </div>
                    
                    {problem.constraints && problem.constraints.length > 0 && (
                        <div>
                            <div className="text-xs font-bold uppercase text-gray-500 mb-2">Constraints</div>
                            <ul className="text-sm text-gray-300 space-y-1">
                                {problem.constraints.map((c, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-accent rounded-full"></div>
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-xs font-bold uppercase text-gray-500 mb-1">Time Limit</div>
                            <div className="text-gray-300">{problem.timeLimit}ms</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase text-gray-500 mb-1">Memory Limit</div>
                            <div className="text-gray-300">{problem.memoryLimit}MB</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ===== PROBLEM MODAL (ADD/EDIT) =====
const ProblemModal = ({ problem, onClose, onSuccess, username }) => {
    const isEditing = !!problem;
    
    const [formData, setFormData] = useState({
        title: problem?.title || '',
        slug: problem?.slug || '',
        description: problem?.description || '',
        difficulty: problem?.difficulty || 'Easy',
        constraints: problem?.constraints || [''],
        timeLimit: problem?.timeLimit || 5000,
        memoryLimit: problem?.memoryLimit || 512,
        goldenSolution: problem?.goldenSolution || '',
        starterCode: problem?.starterCode || {
            javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
let idx = 0;
function read() { return input[idx++]; }

function solve() {
    // Write your code here
}
solve();`,
            python: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data: return
    iterator = iter(data)
    # Use next(iterator) to get inputs

if __name__ == "__main__":
    solve()`,
            cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Write your code here
    
    return 0;
}`,
            java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your code here
    }
}`
        },
        testCases: problem?.testCases || [{ input: '', output: '', isPublic: true }]
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleConstraintChange = (index, value) => {
        const newConstraints = [...formData.constraints];
        newConstraints[index] = value;
        setFormData(prev => ({ ...prev, constraints: newConstraints }));
    };

    const addConstraint = () => {
        setFormData(prev => ({
            ...prev,
            constraints: [...prev.constraints, '']
        }));
    };

    const removeConstraint = (index) => {
        setFormData(prev => ({
            ...prev,
            constraints: prev.constraints.filter((_, i) => i !== index)
        }));
    };

    const handleTestCaseChange = (index, field, value) => {
        const newTestCases = [...formData.testCases];
        newTestCases[index][field] = value;
        setFormData(prev => ({ ...prev, testCases: newTestCases }));
    };

    const addTestCase = () => {
        setFormData(prev => ({
            ...prev,
            testCases: [...prev.testCases, { input: '', output: '', isPublic: false }]
        }));
    };

    const removeTestCase = (index) => {
        if (formData.testCases.length <= 1) {
            toast.error('At least one test case is required');
            return;
        }
        setFormData(prev => ({
            ...prev,
            testCases: prev.testCases.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.title || !formData.slug || !formData.description) {
            toast.error('Title, slug, and description are required');
            return;
        }

        if (formData.testCases.length === 0 || !formData.testCases[0].input) {
            toast.error('At least one test case with input is required');
            return;
        }

        setIsSubmitting(true);
        
        try {
            const cleanedData = {
                ...formData,
                constraints: formData.constraints.filter(c => c.trim() !== '')
            };

            if (isEditing) {
                await api.post(`/admin/problems/${problem._id}/update`, {
                    username,
                    ...cleanedData
                });
                toast.success('Problem updated successfully!');
            } else {
                await api.post('/admin/problems/create', {
                    username,
                    ...cleanedData
                });
                toast.success('Problem created successfully!');
            }

            onSuccess();
        } catch (error) {
            console.error('Problem save error:', error);
            toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} problem`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-[#111] rounded-xl border border-gray-800 w-full max-w-5xl my-8 shadow-2xl">
                <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#111] z-10">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        {isEditing ? <Edit size={24} className="text-blue-400" /> : <Plus size={24} className="text-accent" />}
                        {isEditing ? 'Edit Problem' : 'Add New Problem'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-300">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent transition-all"
                                placeholder="e.g., Two Sum"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-300">
                                Slug <span className="text-red-400">*</span> (URL-friendly)
                            </label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent font-mono transition-all"
                                placeholder="e.g., two-sum"
                                required
                                disabled={isEditing}
                            />
                            {isEditing && (
                                <p className="text-xs text-gray-500 mt-1">Slug cannot be changed after creation</p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold mb-2 text-gray-300">
                            Description <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent min-h-[200px] transition-all"
                            placeholder="Describe the problem in detail..."
                            required
                        />
                    </div>

                    {/* Difficulty & Limits */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-300">Difficulty</label>
                            <select
                                value={formData.difficulty}
                                onChange={(e) => handleChange('difficulty', e.target.value)}
                                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent transition-all cursor-pointer"
                            >
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-300">Time Limit (ms)</label>
                            <input
                                type="number"
                                value={formData.timeLimit}
                                onChange={(e) => handleChange('timeLimit', parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-300">Memory Limit (MB)</label>
                            <input
                                type="number"
                                value={formData.memoryLimit}
                                onChange={(e) => handleChange('memoryLimit', parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent transition-all"
                            />
                        </div>
                    </div>

                    {/* Golden Solution */}
                    <div>
                        <label className="block text-sm font-bold mb-2 text-gray-300 flex items-center gap-2">
                            <Zap className="text-yellow-400" size={18} />
                            Golden Solution (JavaScript) <span className="text-red-400">*</span>
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            This is the reference solution used to verify test cases and validate user submissions.
                            It should accept input as a string and return the expected output as a string.
                        </p>
                        <textarea
                            value={formData.goldenSolution}
                            onChange={(e) => handleChange('goldenSolution', e.target.value)}
                            className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent font-mono text-sm min-h-[250px] transition-all"
                            placeholder={`(input) => {
    const parts = input.trim().split(/\\s+/);
    const n = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    
    // Your golden solution logic here
    let result = "";
    // ... implementation
    
    return result.trim();
}`}
                            required
                        />
                    </div>

                    {/* Constraints */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-bold text-gray-300">Constraints</label>
                            <button
                                type="button"
                                onClick={addConstraint}
                                className="flex items-center gap-1 text-xs px-3 py-1 bg-accent text-black rounded hover:bg-green-400 font-bold transition-all"
                            >
                                <Plus size={14} />
                                Add
                            </button>
                        </div>
                        <div className="space-y-2">
                            {formData.constraints.map((constraint, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={constraint}
                                        onChange={(e) => handleConstraintChange(index, e.target.value)}
                                        className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg focus:outline-none focus:border-accent transition-all"
                                        placeholder="e.g., 1 ≤ n ≤ 10^5"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeConstraint(index)}
                                        className="px-3 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Test Cases */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-bold text-gray-300">
                                Test Cases <span className="text-red-400">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={addTestCase}
                                className="flex items-center gap-1 text-xs px-3 py-1 bg-accent text-black rounded hover:bg-green-400 font-bold transition-all"
                            >
                                <Plus size={14} />
                                Add Test Case
                            </button>
                        </div>
                        <div className="space-y-4">
                            {formData.testCases.map((tc, index) => (
                                <div key={index} className="p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold flex items-center gap-2">
                                            <Database size={16} className="text-blue-400" />
                                            Test Case {index + 1}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleTestCaseChange(index, 'isPublic', !tc.isPublic)}
                                                className={`flex items-center gap-1 text-xs px-3 py-1 rounded font-bold transition-all ${
                                                    tc.isPublic 
                                                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                            >
                                                {tc.isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
                                                {tc.isPublic ? 'Public' : 'Hidden'}
                                            </button>
                                            {formData.testCases.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeTestCase(index)}
                                                    className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Input</label>
                                            <textarea
                                                value={tc.input}
                                                onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                                                className="w-full px-3 py-2 bg-black border border-gray-800 rounded font-mono text-sm focus:outline-none focus:border-accent min-h-[100px] transition-all"
                                                placeholder="5 3"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Expected Output</label>
                                            <textarea
                                                value={tc.output}
                                                onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                                                className="w-full px-3 py-2 bg-black border border-gray-800 rounded font-mono text-sm focus:outline-none focus:border-accent min-h-[100px] transition-all"
                                                placeholder="8"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Starter Code */}
                    <details className="bg-[#0a0a0a] border border-gray-800 rounded-lg">
                        <summary className="p-4 cursor-pointer font-bold hover:bg-gray-900 transition-all flex items-center gap-2">
                            <Code size={18} />
                            Starter Code (Optional - Click to expand)
                        </summary>
                        <div className="p-4 space-y-4 border-t border-gray-800">
                            {Object.keys(formData.starterCode).map(lang => (
                                <div key={lang}>
                                    <label className="block text-sm font-bold mb-2 capitalize text-gray-300">{lang}</label>
                                    <textarea
                                        value={formData.starterCode[lang]}
                                        onChange={(e) => handleChange('starterCode', {
                                            ...formData.starterCode,
                                            [lang]: e.target.value
                                        })}
                                        className="w-full px-3 py-2 bg-black border border-gray-800 rounded font-mono text-xs focus:outline-none focus:border-accent min-h-[200px] transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                    </details>

                    {/* Submit */}
                    <div className="flex gap-3 pt-6 border-t border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 font-bold transition-all"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-accent to-green-400 text-black rounded-lg hover:from-green-400 hover:to-accent font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin" />
                                    {isEditing ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    {isEditing ? 'Update Problem' : 'Create Problem'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #0a0a0a;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #333;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;