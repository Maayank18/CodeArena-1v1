import React from 'react';
import { Flame, Trophy } from 'lucide-react';

/**
 * ConsistencyCalendar Component
 * 
 * A premium glassmorphism component that visualizes user streak
 * and activity over a rolling 7-day period.
 */
const ConsistencyCalendar = () => {
  // Mock data for the rolling 7-day view
  // Status: 'completed' | 'missed' | 'pending'
  const weekData = [
    { day: 'M', status: 'completed', isToday: false },
    { day: 'T', status: 'completed', isToday: false },
    { day: 'W', status: 'missed', isToday: false },
    { day: 'T', status: 'completed', isToday: false },
    { day: 'F', status: 'completed', isToday: false },
    { day: 'S', status: 'pending', isToday: true },
    { day: 'S', status: 'pending', isToday: false },
  ];

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const streakCount = 5;

  return (
    <div className="mx-3 mb-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all hover:border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Consistency</h4>
          <p className="text-[11px] font-medium text-gray-400">{currentMonth}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/20">
          <Flame size={14} className="text-orange-500 fill-current" />
          <span className="text-xs font-black text-orange-400">{streakCount}d</span>
        </div>
      </div>

      {/* 7-Day Heatmap */}
      <div className="flex justify-between items-center gap-1.5 mb-5">
        {weekData.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2">
            <span className={`text-[9px] font-bold ${day.isToday ? 'text-accent' : 'text-gray-500'}`}>
              {day.day}
            </span>
            <div 
              className={`
                w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-500
                ${day.status === 'completed' 
                  ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]' 
                  : day.status === 'missed'
                    ? 'bg-red-500/10 border border-red-500/20'
                    : 'bg-white/5 border border-white/10'
                }
                ${day.isToday ? 'ring-2 ring-accent ring-offset-2 ring-offset-[#121212]' : ''}
              `}
            >
              {day.status === 'completed' && <Trophy size={10} className="text-black fill-current" />}
            </div>
          </div>
        ))}
      </div>

      {/* Daily Action CTA */}
      <button className="w-full group relative overflow-hidden rounded-xl bg-white/5 p-2.5 transition-all hover:bg-white/10 border border-white/5 hover:border-white/10">
        <div className="flex items-start gap-3 text-left">
          <div className="mt-0.5 rounded-lg bg-accent/10 p-1 text-accent group-hover:scale-110 transition-transform">
            <Trophy size={12} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-200">Daily Target</p>
            <p className="text-[9px] text-gray-500 leading-tight mt-0.5">
              Win 1 Battle today to keep your streak alive!
            </p>
          </div>
        </div>
      </button>
    </div>
  );
};

export default ConsistencyCalendar;
