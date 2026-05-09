import React, { useState, useEffect } from 'react';
import { Flame, Trophy, X } from 'lucide-react';
import api from '../api';
import { useTheme } from '../context/ThemeContext';

/**
 * ConsistencyCalendar Component
 * 
 * A premium glassmorphism component that visualizes user streak
 * and activity over a rolling 7-day period using real backend data.
 */
const ConsistencyCalendar = ({ className = "" }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await api.get('/stats/analytics');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('[CALENDAR] Fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  // Use today's date for labels and nodes
  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Prepare week data from activity array (last 7 days)
  // Fallback to empty week if data is missing
  const weekData = (data?.activity || Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      label: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
      dateKey: date.toISOString().split('T')[0],
      attempted: false
    };
  })).map((day, idx) => {
    // Determine if it's today
    const date = new Date(day.dateKey);
    const isToday = date.toDateString() === today.toDateString();
    
    return {
      label: day.label,
      status: day.attempted ? 'completed' : (idx < 6 ? 'missed' : 'pending'),
      isToday
    };
  });

  const { isDark } = useTheme();

  // If no data yet, show loading or empty states
  if (loading) {
    return (
      <div className={`bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 rounded-3xl p-4 animate-pulse h-[180px] ${className}`} />
    );
  }

  const streakCount = data?.summary?.currentStreak || 0;

  return (
    <div className={`bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 rounded-3xl p-4 shadow-xl dark:shadow-2xl transition-all hover:border-gray-200 dark:hover:border-white/10 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500">Consistency</h4>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-0.5">{currentMonth}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
          streakCount > 0 
            ? 'bg-orange-500/5 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
            : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-400 dark:text-gray-500 opacity-80 dark:opacity-50'
        }`}>
          <Flame size={14} className={streakCount > 0 ? "text-orange-500 fill-current" : ""} />
          <span className="text-xs font-black">{streakCount}d</span>
        </div>
      </div>

      {/* 7-Day Labels */}
      <div className="grid grid-cols-7 w-full gap-1 mb-2 px-1">
        {weekData.map((day, idx) => (
          <span key={idx} className={`text-[10px] font-black text-center ${day.isToday ? 'text-accent/80' : 'text-gray-500'}`}>
            {day.label}
          </span>
        ))}
      </div>

      {/* 7-Day Nodes */}
      <div className="grid grid-cols-7 w-full gap-1 mb-6 px-1">
        {weekData.map((day, idx) => (
          <div 
            key={idx}
            className={`
              w-full aspect-square max-w-[32px] mx-auto rounded-lg flex items-center justify-center transition-all duration-300
              ${day.status === 'completed' 
                ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]' 
                : day.status === 'missed'
                  ? 'bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10'
                  : 'bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10'
              }
              ${day.isToday && day.status !== 'completed' ? 'ring-1 ring-inset ring-accent/30 dark:ring-accent/50 bg-accent/5' : ''}
            `}
          >
            {day.status === 'completed' ? (
              <Trophy size={14} className="text-black dark:text-black fill-current animate-bounce-subtle" />
            ) : day.status === 'missed' ? (
              <X size={10} className="text-red-500/40 dark:text-red-500/30" />
            ) : null}
          </div>
        ))}
      </div>

      {/* Daily Action CTA Section */}
      <div className="rounded-2xl bg-gray-50 dark:bg-black/30 p-3 border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-colors">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-accent/10 p-2 text-accent">
            <Trophy size={16} className="fill-current" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-gray-700 dark:text-gray-100">Daily Target</p>
            <p className="text-[10px] text-gray-500 leading-tight mt-0.5 font-medium">
              {weekData[6]?.status === 'completed' 
                ? "Target achieved! Come back tomorrow." 
                : "Attempt any question today to keep your streak alive!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsistencyCalendar;
