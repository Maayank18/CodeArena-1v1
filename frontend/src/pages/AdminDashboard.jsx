import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Trophy, TrendingUp, Activity, Clock, AlertTriangle,
    RefreshCw, Trash2, Edit, Search, BarChart, Shield, LogOut,
    Code, Plus, X, Eye, EyeOff, Save, ChevronDown, ChevronUp,
    CheckCircle, Zap, Database, Star,
    ChevronLeft, ChevronRight, Download, ArrowUp,
    ArrowDown, Target, HardDrive, Upload, Image, Loader2,
    Wifi, AlertCircle, Info, Layers,
    UserCheck, BarChart2, PieChart, TrendingDown,
    Server, Radio, Save as SaveIcon, Settings, RotateCcw,
    ShieldCheck, ShieldOff
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
    { id: 'payments',    icon: Shield,    label: 'Payments'    },
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

const SUGGESTED_PROBLEM_TOPICS = [
    'arrays',
    'strings',
    'trees',
    'graphs',
    'dynamic programming',
    'sorting',
    'binary search',
    'linked lists',
    'stacks',
    'queues',
    'hash tables',
    'recursion',
];

const normalizeProblemTopic = (value) => (
    typeof value === 'string'
        ? value.trim().toLowerCase().replace(/\s+/g, ' ')
        : ''
);

const readStoredUser = () => {
    try {
        const raw = localStorage.getItem('codearena_user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const resolveAdminUsername = () => (
    String(import.meta.env.VITE_ADMIN_USERNAME || 'Maya').trim().toLowerCase()
);

const SPINNER_SIZE_CLASS_MAP = {
    4: 'h-4 w-4',
    8: 'h-8 w-8',
};

const SYSTEM_STAT_COLOR_CLASS_MAP = {
    blue: 'text-blue-400',
    yellow: 'text-amber-400',
    green: 'text-emerald-400',
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) : '—';
const fmtDateTime = (d) => d ? `${fmtDate(d)}, ${fmtTime(d)}` : '—';
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
    <div className={`animate-spin rounded-full border-2 border-gray-700 border-t-accent ${SPINNER_SIZE_CLASS_MAP[size] || SPINNER_SIZE_CLASS_MAP[8]}`} />
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
    const [payments, setPayments]               = useState([]);
    const [recentActivity, setRecentActivity]   = useState({ matches:[], users:[] });
    const [hourlyActivity, setHourlyActivity]   = useState([]);
    const [systemHealth, setSystemHealth]       = useState(null);
    const [loading, setLoading]                 = useState(true);
    const [refreshing, setRefreshing]           = useState(false);
    const [activeTab, setActiveTab]             = useState('overview');

    // Modals
    const [showAddProblem, setShowAddProblem]   = useState(false);
    const [editingProblem, setEditingProblem]   = useState(null);
    const [viewingUser, setViewingUser]         = useState(null);
    const [editingUser, setEditingUser]         = useState(null);
    const [viewingMatch, setViewingMatch]       = useState(null);
    const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
    const [selectedUserForQuota, setSelectedUserForQuota] = useState(null);
    const [quotaFormData, setQuotaFormData] = useState({
        chatQueriesToday: 0,
        matchesToday: 0,
        customMatchesToday: 0,
        visualizationsToday: 0,
        aiHelpToday: 0,
        subscriptionPlan: 'free',
        // Support custom overrides as well!
        customChatQueriesLimit: 0,
        customMatchesLimit: 0,
        customCustomMatchesLimit: 0,
        customVisualizationsLimit: 0,
        customAIHelpLimit: 0,
        hasCustomLimits: false
    });

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
        const stored = readStoredUser();
        if (!stored) { navigate('/login'); return; }
        const adminUsername = resolveAdminUsername();
        if (String(stored.username || '').trim().toLowerCase() !== adminUsername) {
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
            const [statsRes, usersRes, activityRes, hourlyRes, problemsRes, matchesRes, healthRes, paymentsRes] = await Promise.all([
                api.post('/admin/stats',              { username }),
                api.post('/admin/users',              { username, limit: 500 }),
                api.post('/admin/activity/recent',    { username }),
                api.post('/admin/activity/hourly',    { username }),
                api.post('/admin/problems',           { username }),
                api.post('/admin/matches',            { username, limit: 500 }),
                api.post('/admin/system/health',      { username }).catch(() => ({ data: null })),
                api.get('/payments/admin/transactions', { params: { status: 'all' } }).catch(() => ({ data: { transactions: [] } }))
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data.users || []);
            setRecentActivity(activityRes.data);
            setHourlyActivity(hourlyRes.data.hourlyActivity || []);
            setProblems(problemsRes.data.problems || []);
            setMatches(matchesRes.data.matches || []);
            setSystemHealth(healthRes.data);
            setPayments(paymentsRes.data?.transactions || []);
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
        } catch (error) {
            console.warn('Failed to fetch live admin stats:', error);
        }
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

    const getStandardLimit = (plan, key) => {
        const planLimits = {
            free:    { chat: 7, matches: 3, custom: 0, visualizations: 0, aiHelp: 0 },
            plus:    { chat: 10, matches: 5, custom: 3, visualizations: 3, aiHelp: 1 },
            pro:     { chat: 50, matches: Infinity, custom: 15, visualizations: 10, aiHelp: 3 },
            premium: { chat: Infinity, matches: Infinity, custom: Infinity, visualizations: Infinity, aiHelp: 7 }
        };
        const resolvedPlan = planLimits[plan] || planLimits.free;
        
        const keyMap = {
            chatQueriesToday: 'chat',
            matchesToday: 'matches',
            customMatchesToday: 'custom',
            visualizationsToday: 'visualizations',
            aiHelpToday: 'aiHelp'
        };
        return resolvedPlan[keyMap[key]] ?? 'Unlimited';
    };

    const getLimitDisplay = (key) => {
        if (quotaFormData.hasCustomLimits) {
            const overrideKeyMap = {
                chatQueriesToday: 'customChatQueriesLimit',
                matchesToday: 'customMatchesLimit',
                customMatchesToday: 'customCustomMatchesLimit',
                visualizationsToday: 'customVisualizationsLimit',
                aiHelpToday: 'customAIHelpLimit'
            };
            const overrideVal = quotaFormData[overrideKeyMap[key]];
            if (overrideVal !== undefined && overrideVal !== '' && overrideVal !== null) {
                return `${overrideVal} (Override)`;
            }
        }
        
        const limit = getStandardLimit(quotaFormData.subscriptionPlan, key);
        return limit === Infinity ? 'Unlimited' : limit;
    };

    const handleUpdateQuotas = async (e) => {
        if (e) e.preventDefault();
        try {
            const res = await api.patch(`/admin/users/${selectedUserForQuota._id}/usage`, {
                username: adminUser.username,
                ...quotaFormData
            });
            toast.success("User quotas updated!");
            setIsQuotaModalOpen(false);
            setUsers(prev => prev.map(u => u._id === selectedUserForQuota._id ? { ...u, ...res.data.user } : u));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update quotas');
        }
    };

    const handleBanUser = async (userId, username, isCurrentlyBanned = false) => {
        const actionLabel = isCurrentlyBanned ? 'Unban' : 'Ban';
        if (!confirm(`${actionLabel} user "${username}"?`)) return;
        try {
            await api.post(`/admin/users/${userId}/ban`, {
                username: adminUser.username,
                banned: !isCurrentlyBanned,
            });
            toast.success(`User "${username}" ${isCurrentlyBanned ? 'unbanned' : 'banned'}`);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, banned: !isCurrentlyBanned } : u));
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

    const handleVerifyPayment = async (transactionId, decision) => {
        if (!confirm(`Are you sure you want to ${decision} this payment?`)) return;
        try {
            const res = await api.post('/payments/verify-utr', {
                transactionId,
                decision,
                adminNotes: `Manually ${decision} by ${adminUser.username}`
            });
            toast.success(res.data.message);
            fetchAll(adminUser.username);
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${decision} payment`);
        }
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
        () => problems.filter((problem) => problem.type !== 'campaign'),
        [problems]
    );

    const campaignProblems = useMemo(
        () => problems.filter((problem) => problem.type === 'campaign'),
        [problems]
    );

    const campaignRegionOptions = useMemo(
        () => CAMPAIGN_REGIONS.map((region) => ({ id: region.id, name: region.name })),
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
                                                            <button onClick={() => {
                                                                 setSelectedUserForQuota(u);
                                                                 setQuotaFormData({
                                                                     chatQueriesToday: u.usageStats?.chatQueriesToday || 0,
                                                                     matchesToday: u.usageStats?.matchesToday || 0,
                                                                     customMatchesToday: u.usageStats?.customMatchesToday || 0,
                                                                     visualizationsToday: u.usageStats?.visualizationsToday || 0,
                                                                     aiHelpToday: u.usageStats?.aiHelpToday || 0,
                                                                     subscriptionPlan: u.subscriptionPlan || 'free',
                                                                     customChatQueriesLimit: u.customLimits?.chatQueriesLimit ?? '',
                                                                     customMatchesLimit: u.customLimits?.matchesLimit ?? '',
                                                                     customCustomMatchesLimit: u.customLimits?.customMatchesLimit ?? '',
                                                                     customVisualizationsLimit: u.customLimits?.visualizationsLimit ?? '',
                                                                     customAIHelpLimit: u.customLimits?.aiHelpLimit ?? '',
                                                                     hasCustomLimits: u.customLimits?.hasCustomLimits ?? false
                                                                 });
                                                                 setIsQuotaModalOpen(true);
                                                             }} title="Manage Quotas"
                                                                 className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded hover:bg-emerald-500/30 transition-all mr-1">
                                                                 <Settings size={14}/>
                                                             </button>
                                                             <button
                                                                onClick={() => handleBanUser(u._id, u.username, !!u.banned)}
                                                                title={u.banned ? 'Unban User' : 'Ban User'}
                                                                className={`p-1.5 rounded transition-all ${
                                                                    u.banned
                                                                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30'
                                                                        : 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/30'
                                                                }`}
                                                            >
                                                                {u.banned ? <ShieldCheck size={14}/> : <ShieldOff size={14}/>}
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
                                        {campaignRegionOptions.map((region) => (
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

                {/* ════════ PAYMENTS TAB ════════ */}
                {activeTab === 'payments' && (
                    <PaymentsTab payments={payments} onVerify={handleVerifyPayment} />
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
                    initialType={problemView}
                    key={`new-problem-${problemView}`}/>
            )}
            {editingProblem && (
                <ProblemModal 
                    key={editingProblem?._id || 'edit-problem'}
                    problem={editingProblem} 
                    onClose={() => setEditingProblem(null)}
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
            {isQuotaModalOpen && selectedUserForQuota && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all duration-300">
                    <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#151b26]/95 to-[#0b0f17]/98 border border-emerald-500/20 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-800/60 bg-emerald-500/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/10">
                                    <Settings className="animate-spin-slow" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white tracking-tight">Customer Success Override</h3>
                                    <p className="text-xs text-gray-400">Configure plans, quotas, and custom limits for <span className="text-emerald-400 font-semibold">{selectedUserForQuota.username}</span></p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setIsQuotaModalOpen(false)} className="text-gray-400 hover:text-white p-1 hover:bg-gray-800/60 rounded-lg transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <form onSubmit={handleUpdateQuotas} className="p-6 overflow-y-auto space-y-6 custom-scroll text-left">
                            {/* Plan Configuration */}
                            <div className="bg-gray-900/40 border border-gray-800/80 rounded-xl p-4 space-y-3.5">
                                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers size={14} /> Subscription Tier
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Select Plan Tier</label>
                                        <select
                                            value={quotaFormData.subscriptionPlan}
                                            onChange={(e) => setQuotaFormData(prev => ({ ...prev, subscriptionPlan: e.target.value }))}
                                            className="w-full bg-[#111622] border border-gray-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-all"
                                        >
                                            <option value="free">Novice / Free (Standard Limits)</option>
                                            <option value="plus">Plus (₹49 / Mo)</option>
                                            <option value="pro">Pro (₹99 / Mo)</option>
                                            <option value="premium">Premium (₹149 / Mo)</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col justify-center bg-gray-950/40 border border-gray-800/40 rounded-lg px-3 py-2.5">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Plan Allowances</span>
                                        <span className="text-xs text-gray-300 mt-1">
                                            {quotaFormData.subscriptionPlan === 'plus' && "Plus Tier: 10 daily chats, 5 matches, 3 custom rooms, 1 AI help"}
                                            {quotaFormData.subscriptionPlan === 'pro' && "Pro Tier: 50 daily chats, Unlimited matches, 15 custom rooms, 3 AI helps"}
                                            {quotaFormData.subscriptionPlan === 'premium' && "Premium Tier: Unlimited daily chats, Unlimited matches, Unlimited custom rooms, 7 AI helps"}
                                            {quotaFormData.subscriptionPlan === 'free' && "Free Tier: 7 daily chats, 3 matches, 0 custom rooms, 0 AI help"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Current Usage Controls */}
                            <div className="bg-gray-900/40 border border-gray-800/80 rounded-xl p-4 space-y-4">
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Activity size={14} /> Attempts Consumed / Used Today
                                    </h4>
                                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                                        These numbers show how many matches or queries the user has <strong>already consumed</strong> today. 
                                        A value of <code>0</code> means they have not used any allowance yet today. 
                                        Click the reset icon (<RotateCcw size={10} className="inline mb-0.5" />) next to a stat to instantly restore their full daily allowance.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Chat Queries', key: 'chatQueriesToday' },
                                        { label: 'Normal Matches', key: 'matchesToday' },
                                        { label: 'Custom Matches', key: 'customMatchesToday' },
                                        { label: 'Visualizations', key: 'visualizationsToday' },
                                        { label: 'AI Help Requests', key: 'aiHelpToday' }
                                    ].map(item => (
                                        <div key={item.key} className="bg-gray-950/40 border border-gray-800/50 rounded-lg p-3 space-y-2 text-left flex flex-col justify-between">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-300">{item.label}</label>
                                                <span className="block text-[10px] text-gray-500 mb-1.5">
                                                    Currently: <strong className="text-emerald-400">{quotaFormData[item.key]}</strong> / {getLimitDisplay(item.key)} used
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={quotaFormData[item.key]}
                                                    onChange={(e) => setQuotaFormData(prev => ({ ...prev, [item.key]: parseInt(e.target.value) || 0 }))}
                                                    className="w-full bg-[#111622] border border-gray-800 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    title="Reset to 0"
                                                    onClick={() => setQuotaFormData(prev => ({ ...prev, [item.key]: 0 }))}
                                                    className="p-2 bg-gray-800 hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400 rounded-lg border border-gray-800 hover:border-emerald-500/30 transition-all shrink-0"
                                                >
                                                    <RotateCcw size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Overrides Controls */}
                            <div className="bg-gray-900/40 border border-gray-800/80 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between border-b border-gray-800/60 pb-2">
                                    <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Zap size={14} /> Custom Daily Limit Overrides
                                    </h4>
                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={quotaFormData.hasCustomLimits}
                                            onChange={(e) => setQuotaFormData(prev => ({ ...prev, hasCustomLimits: e.target.checked }))}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
                                        <span className="ml-2.5 text-xs font-bold text-gray-400 peer-checked:text-emerald-400 transition-colors">Enabled</span>
                                    </label>
                                </div>

                                {quotaFormData.hasCustomLimits ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Chat Limit Override', key: 'customChatQueriesLimit' },
                                            { label: 'Matches Limit Override', key: 'customMatchesLimit' },
                                            { label: 'Custom Rooms Limit Override', key: 'customCustomMatchesLimit' },
                                            { label: 'Visualizations Limit Override', key: 'customVisualizationsLimit' },
                                            { label: 'AI Help Limit Override', key: 'customAIHelpLimit' }
                                        ].map(item => (
                                            <div key={item.key} className="bg-gray-950/40 border border-emerald-500/10 rounded-lg p-3 space-y-2 text-left">
                                                <label className="block text-xs font-semibold text-gray-300">{item.label}</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Default"
                                                    value={quotaFormData[item.key]}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setQuotaFormData(prev => ({ ...prev, [item.key]: val === '' ? '' : parseInt(val) }));
                                                    }}
                                                    className="w-full bg-[#111622] border border-gray-800 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none transition-all"
                                                />
                                                <span className="block text-[10px] text-gray-500">Leave blank for plan default</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 bg-gray-950/20 border border-dashed border-gray-800/40 rounded-lg">
                                        <p className="text-xs text-gray-500">Enable custom overrides to configure granular limits for specific features.</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center justify-end gap-3 border-t border-gray-800/60 pt-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsQuotaModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-lg shadow-lg shadow-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center gap-1.5"
                                >
                                    <Save size={14} /> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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
const OverviewTab = ({ users, matches, problems, recentActivity }) => {
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
const AnalyticsTab = ({ users, matches, hourlyActivity }) => {
    const safeHourlyActivity = hourlyActivity.length === 24 ? hourlyActivity : new Array(24).fill(0);
    const peakCount = Math.max(...safeHourlyActivity, 0);
    const maxHourly = Math.max(...safeHourlyActivity, 1);
    const peakHour  = safeHourlyActivity.indexOf(peakCount);
    const totalHourly = safeHourlyActivity.reduce((a,b)=>a+b,0);

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
                        <span>Peak: <span className="text-accent font-bold">{`${String(Math.max(peakHour, 0)).padStart(2, '0')}:00`} ({peakCount} matches)</span></span>
                    </div>
                </div>
                <div className="flex items-end gap-1 h-48">
                    {safeHourlyActivity.map((count, hour) => {
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
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                                            style={{ width: `${(count / maxBucket) * 100}%` }}
                                        />
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
                                <span className={SYSTEM_STAT_COLOR_CLASS_MAP[d.color] || SYSTEM_STAT_COLOR_CLASS_MAP.green}>{d.icon}</span>
                                <span className="font-semibold text-sm">{d.collection}</span>
                            </div>
                            <div className={`text-2xl font-black ${SYSTEM_STAT_COLOR_CLASS_MAP[d.color] || SYSTEM_STAT_COLOR_CLASS_MAP.green}`}>{d.count}</div>
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
                    {problem.topics?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {problem.topics.map((t, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold border border-accent/20">{t}</span>
                            ))}
                        </div>
                    )}
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
        inputFormatDescription: problem?.inputFormatDescription || '',
        difficulty:      problem?.difficulty  || 'Easy',
        type:            problem?.type || initialType,
        campaignRegion:  problem?.campaignRegion || '',
        campaignNodeId:  problem?.campaignNodeId || '',
        constraints:     problem?.constraints || [''],
        timeLimit:       problem?.timeLimit   || 5000,
        memoryLimit:     problem?.memoryLimit || 512,
        goldenSolution:  problem?.goldenSolution || '',
        starterCode:     problem?.starterCode || {
            javascript: `const fs = require('fs');\n\nfunction solve() {\n    const input = fs.readFileSync(0, 'utf-8').trim();\n\n    // CodeArena runs in Standard I/O mode.\n    // Write the full program from scratch: input parsing, helper functions, and output.\n}\n\nsolve();`,
            python:     `import sys\n\ndef solve():\n    data = sys.stdin.read().split()\n\n    # CodeArena runs in Standard I/O mode.\n    # Write the full program from scratch: input parsing, helper functions, and output.\n\nif __name__ == "__main__":\n    solve()`,
            cpp:        `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // CodeArena runs in Standard I/O mode.\n    // Write the full program from scratch: input parsing, helper functions, and output.\n\n    return 0;\n}`,
            java:       `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\n        // CodeArena runs in Standard I/O mode.\n        // Write the full program from scratch: input parsing, helper methods, and output.\n    }\n}`,
        },
        testCases: problem?.testCases || [{ input:'', displayInput:'', visualInput:'', output:'', explanation:'', isPublic:true }],
        topics: problem?.topics || [],
        problemImage: problem?.problemImage || '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeCodeTab, setActiveCodeTab] = useState('javascript');
    const [topicInput, setTopicInput] = useState('');
    const fileInputRef = useRef(null);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        const formDataPayload = new FormData();
        formDataPayload.append('image', file);
        formDataPayload.append('username', username);

        setUploading(true);
        try {
            const res = await api.post('/admin/problems/upload-image', formDataPayload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            set('problemImage', res.data.imageUrl);
            toast.success('Image uploaded successfully');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
    const updateTopics = useCallback((nextTopics) => {
        const normalizedTopics = Array.from(
            new Set(
                (nextTopics || [])
                    .map(normalizeProblemTopic)
                    .filter(Boolean)
            )
        );
        set('topics', normalizedTopics);
    }, []);
    const resolvedProblemType = String(formData.type ?? '').trim().toLowerCase() === 'campaign'
        ? 'campaign'
        : 'battle';
    const setProblemType = useCallback((nextType) => {
        const normalizedType = String(nextType ?? '').trim().toLowerCase() === 'campaign'
            ? 'campaign'
            : 'battle';

        setFormData((prev) => ({
            ...prev,
            type: normalizedType,
            campaignRegion: normalizedType === 'campaign' ? prev.campaignRegion : '',
            campaignNodeId: normalizedType === 'campaign' ? prev.campaignNodeId : '',
        }));
    }, []);

    useEffect(() => {
        if (problem) {
            setFormData({
                title:           problem.title || '',
                slug:            problem.slug  || '',
                description:     problem.description || '',
                inputFormatDescription: problem.inputFormatDescription || '',
                difficulty:      problem.difficulty  || 'Easy',
                type:            problem.type || initialType,
                campaignRegion:  problem.campaignRegion || '',
                campaignNodeId:  problem.campaignNodeId || '',
                constraints:     problem.constraints || [''],
                timeLimit:       problem.timeLimit   || 5000,
                memoryLimit:     problem.memoryLimit || 512,
                goldenSolution:  problem.goldenSolution || '',
                starterCode:     problem.starterCode || {
                    javascript: `const fs = require('fs');\n\nfunction solve() {\n    const input = fs.readFileSync(0, 'utf-8').trim();\n\n    // CodeArena runs in Standard I/O mode.\n    // Write the full program from scratch: input parsing, helper functions, and output.\n}\n\nsolve();`,
                    python:     `import sys\n\ndef solve():\n    data = sys.stdin.read().split()\n\n    # CodeArena runs in Standard I/O mode.\n    # Write the full program from scratch: input parsing, helper functions, and output.\n\nif __name__ == "__main__":\n    solve()`,
                    cpp:        `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    // CodeArena runs in Standard I/O mode.\n    // Write the full program from scratch: input parsing, helper functions, and output.\n\n    return 0;\n}`,
                    java:       `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\n        // CodeArena runs in Standard I/O mode.\n        // Write the full program from scratch: input parsing, helper methods, and output.\n    }\n}`,
                },
                testCases: problem.testCases || [{ input:'', displayInput:'', visualInput:'', output:'', explanation:'', isPublic:true }],
                topics: problem.topics || [],
                problemImage: problem.problemImage || '',
            });
            return;
        }

        setProblemType(initialType);
    }, [initialType, problem, setProblemType]);

    const addTopicFromInput = useCallback(() => {
        const normalizedTopic = normalizeProblemTopic(topicInput);
        if (!normalizedTopic) {
            return;
        }

        if ((formData.topics || []).includes(normalizedTopic)) {
            toast.error('That tag is already added');
            return;
        }

        updateTopics([...(formData.topics || []), normalizedTopic]);
        setTopicInput('');
    }, [formData.topics, topicInput, updateTopics]);

    const toggleTopic = useCallback((topic) => {
        const normalizedTopic = normalizeProblemTopic(topic);
        const currentTopics = formData.topics || [];

        if (currentTopics.includes(normalizedTopic)) {
            updateTopics(currentTopics.filter((existingTopic) => existingTopic !== normalizedTopic));
            return;
        }

        updateTopics([...currentTopics, normalizedTopic]);
    }, [formData.topics, updateTopics]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.slug || !formData.description) {
            toast.error('Title, slug, and description are required'); return;
        }
        if (resolvedProblemType === 'campaign' && !formData.campaignRegion) {
            toast.error('Campaign problems need a region number'); return;
        }
        if (resolvedProblemType === 'campaign' && !String(formData.campaignNodeId).trim()) {
            toast.error('Campaign problems need a target node ID'); return;
        }
        if (!formData.testCases[0]?.input) {
            toast.error('At least one test case with input is required'); return;
        }
        setSubmitting(true);
        try {
            const payload = {
                username,
                title: formData.title,
                slug: formData.slug,
                description: formData.description,
                inputFormatDescription: formData.inputFormatDescription,
                difficulty: formData.difficulty,
                type: resolvedProblemType,
                campaignRegion: resolvedProblemType === 'campaign' ? Number(formData.campaignRegion) : undefined,
                campaignNodeId: resolvedProblemType === 'campaign' ? String(formData.campaignNodeId).trim() : undefined,
                constraints: formData.constraints.filter(c => c && c.trim()),
                timeLimit: formData.timeLimit,
                memoryLimit: formData.memoryLimit,
                problemImage: formData.problemImage?.trim() || undefined,
                goldenSolution: formData.goldenSolution,
                starterCode: formData.starterCode,
                testCases: formData.testCases.map((testCase) => ({
                    input: testCase.input,
                    displayInput: testCase.displayInput || '',
                    visualInput: testCase.visualInput || '',
                    output: testCase.output,
                    explanation: testCase.explanation || '',
                    isPublic: Boolean(testCase.isPublic),
                })),
                topics: (formData.topics || [])
                    .map(normalizeProblemTopic)
                    .filter(Boolean),
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
                            <Badge color={resolvedProblemType === 'campaign' ? 'purple' : 'green'}>
                                {PROBLEM_TYPE_META[resolvedProblemType]?.shortLabel || 'Battle Arena'}
                            </Badge>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                            {Object.entries(PROBLEM_TYPE_META).map(([key, meta]) => {
                                const isActive = resolvedProblemType === key;

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setProblemType(key)}
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

                    {resolvedProblemType === 'campaign' && (
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
 
                    <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-4">
                        <label className="block text-sm font-semibold mb-3 text-gray-300">Problem Image (Optional)</label>
                        
                        <div className="flex items-start gap-4">
                            {formData.problemImage ? (
                                <div className="relative group shrink-0">
                                    <img 
                                        src={formData.problemImage} 
                                        alt="Problem" 
                                        className="w-32 h-32 object-cover rounded-xl border border-gray-700 shadow-lg"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => set('problemImage', '')}
                                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                                    >
                                        <X size={12}/>
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-800 bg-black/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent/40 hover:bg-accent/5 transition-all"
                                >
                                    <Image size={24} className="text-gray-600"/>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">No Image</span>
                                </div>
                            )}

                            <div className="flex-1 space-y-3">
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Upload a pictorial representation (Tree, Graph, etc.) from your local device. 
                                    Max 5MB.
                                </p>
                                
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleImageUpload} 
                                    className="hidden" 
                                    accept="image/*"
                                />
                                
                                <button
                                    type="button"
                                    disabled={uploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                        uploading 
                                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                                            : 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20'
                                    }`}
                                >
                                    {uploading ? (
                                        <Loader2 size={16} className="animate-spin"/>
                                    ) : (
                                        <Upload size={16}/>
                                    )}
                                    {uploading ? 'Uploading...' : formData.problemImage ? 'Change Image' : 'Upload Image'}
                                </button>
                                
                                {formData.problemImage && (
                                    <div className="text-[10px] font-mono text-gray-600 truncate max-w-[200px]">
                                        Path: {formData.problemImage}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-gray-300">Input Format Details</label>
                        <p className="text-xs text-gray-600 mb-2">Supports markdown. Explain exactly how users should read raw stdin, for example: Line 1 contains N, Line 2 contains the array, Line 3 contains the target.</p>
                        <textarea
                            value={formData.inputFormatDescription}
                            onChange={e => set('inputFormatDescription', e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 min-h-[120px] transition-all resize-y"
                            placeholder={"## Input Format\n- Line 1 contains N\n- Line 2 contains the array elements\n- Line 3 contains the target value"}
                        />
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

                    {/* Topics */}
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-gray-300">Topics</label>
                        <p className="text-xs text-gray-600 mb-2">Tag this problem with data structure or algorithm topics. Type a tag name and press Enter to add it, or use the quick picks below.</p>
                        <div className="mb-3">
                            <input
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addTopicFromInput();
                                    }
                                }}
                                className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:border-accent/60 transition-all"
                                placeholder="Type a tag like segment tree and press Enter"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {SUGGESTED_PROBLEM_TOPICS.map(t => (
                                <button key={t} type="button" onClick={() => toggleTopic(t)}
                                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                                    formData.topics?.includes(t)
                                        ? 'bg-accent text-black'
                                        : 'bg-gray-800 text-gray-500 hover:text-gray-300 hover:bg-gray-700'
                                }`}>{t}</button>
                            ))}
                        </div>
                        {formData.topics?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.topics.map((topic) => (
                                    <button
                                        key={topic}
                                        type="button"
                                        onClick={() => toggleTopic(topic)}
                                        className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-black transition-all hover:bg-accent/80"
                                    >
                                        <span>{topic}</span>
                                        <X size={12} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Golden solution */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5 text-gray-300">
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
                            <button type="button" onClick={()=>set('testCases',[...formData.testCases,{input:'',displayInput:'',visualInput:'',output:'',explanation:'',isPublic:false}])}
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
                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Display Input (e.g. nums=[1,2])</label>
                                            <textarea
                                                value={tc.displayInput || ''}
                                                onChange={e=>{const nt=[...formData.testCases];nt[i]={...nt[i],displayInput:e.target.value};set('testCases',nt);}}
                                                className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg font-mono text-xs focus:outline-none focus:border-accent/60 min-h-[60px] resize-y transition-all"
                                                placeholder={'nums = [2, 7, 11, 15]\ntarget = 9'}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Visual Input (Optional)</label>
                                            <textarea
                                                value={tc.visualInput || ''}
                                                onChange={e=>{const nt=[...formData.testCases];nt[i]={...nt[i],visualInput:e.target.value};set('testCases',nt);}}
                                                className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg font-mono text-xs focus:outline-none focus:border-accent/60 min-h-[60px] resize-y transition-all"
                                                placeholder={'[2,7,11,15]'}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <label className="block text-xs text-gray-600 mb-1">Explanation (Optional)</label>
                                        <textarea
                                            value={tc.explanation || ''}
                                            onChange={e=>{const nt=[...formData.testCases];nt[i]={...nt[i],explanation:e.target.value};set('testCases',nt);}}
                                            className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-xs focus:outline-none focus:border-accent/60 min-h-[80px] resize-y transition-all"
                                            placeholder={'Because nums[0] + nums[1] == 9, we return [0, 1].'}
                                        />
                                        <p className="mt-1 text-[11px] text-gray-600">Explain why this output is produced. Supports plain text.</p>
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

// ═══════════════════════════════════════════════════════════════
// PAYMENTS TAB
// ═══════════════════════════════════════════════════════════════
const PaymentsTab = ({ payments, onVerify }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <StatCard icon={<Shield size={22} className="text-amber-400"/>} title="Pending"
                    value={payments.filter(p=>p.status==='pending').length} color="yellow"/>
                <StatCard icon={<CheckCircle size={22} className="text-emerald-400"/>} title="Approved"
                    value={payments.filter(p=>p.status==='approved').length} color="green"/>
                <StatCard icon={<AlertTriangle size={22} className="text-red-400"/>} title="Rejected"
                    value={payments.filter(p=>p.status==='rejected').length} color="red"/>
            </div>

            <div className="bg-gray-900/30 border border-gray-800/60 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800/60">
                    <h3 className="font-bold flex items-center gap-2"><Shield size={16} className="text-accent"/> Transaction Queue</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-900/60 border-b border-gray-800">
                            <tr>
                                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Date</th>
                                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">User</th>
                                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Plan</th>
                                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">UTR</th>
                                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Status</th>
                                <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {payments.map(p => (
                                <tr key={p._id} className="hover:bg-gray-800/30 transition-colors">
                                    <td className="px-4 py-3 text-gray-400 text-xs">{fmtDateTime(p.createdAt)}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-white">{p.userId?.username || 'Unknown'}</div>
                                        <div className="text-[10px] text-gray-500">{p.userId?.email || ''}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                            p.planId === 'premium' ? 'bg-purple-500/20 text-purple-400' :
                                            p.planId === 'pro' ? 'bg-accent/20 text-accent' :
                                            'bg-emerald-500/20 text-emerald-400'
                                        }`}>
                                            {p.planId}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-300 font-mono text-xs tracking-widest">{p.utrNumber}</td>
                                    <td className="px-4 py-3">
                                        <Badge color={p.status==='approved'?'green':p.status==='rejected'?'red':'yellow'}>
                                            {p.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {p.status === 'pending' ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => onVerify(p._id, 'approved')} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded font-bold text-xs transition-all">
                                                    Approve
                                                </button>
                                                <button onClick={() => onVerify(p._id, 'rejected')} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded font-bold text-xs transition-all">
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-600">Reviewed</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {!payments.length && (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500 text-sm">No transactions found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
// V 1.5
