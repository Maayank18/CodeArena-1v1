import React from 'react';
import { Flame, Trophy } from 'lucide-react';

/**
 * ConsistencyCalendar Component
 * 
 * A premium glassmorphism component that visualizes user streak
 * and activity over a rolling 7-day period.
 */
const ConsistencyCalendar = ({ className = "" }) => {
  // Dynamic 7-day logic based on actual system date
  const today = new Date();
  const todayIndex = today.getDay(); // 0 (Sun) to 6 (Sat)
  
  // Define the week layout starting from Monday (1) to Sunday (0)
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayIndices = [1, 2, 3, 4, 5, 6, 0];
  
  const weekData = dayIndices.map((idx, i) => {
    // Determine status based on mock history vs today
    let status = 'pending';
    if (idx === todayIndex) {
      status = 'pending'; // Today starts as pending
    } else if (idx < todayIndex || (todayIndex === 0 && idx !== 0)) {
      // It's a past day (logic handles Sunday as index 0 correctly for a Mon-Sun view)
      status = Math.random() > 0.3 ? 'completed' : 'missed';
    }

    return {
      label: labels[i],
      status,
      isToday: idx === todayIndex
    };
  });

  const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  const streakCount = 5;

  return (
    <div className={`bg-[#1a1a1a] border border-white/5 rounded-3xl p-4 shadow-2xl transition-all hover:border-white/10 ${className}`}>
      {/* Header - Image Style */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500">Consistency</h4>
          <p className="text-sm font-bold text-gray-200 mt-0.5">{currentMonth}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
          <Flame size={14} className="text-orange-500 fill-current" />
          <span className="text-xs font-black text-orange-400">{streakCount}d</span>
        </div>
      </div>

      {/* 7-Day Labels Grid - Synchronized with Nodes */}
      <div className="grid grid-cols-7 w-full gap-1 mb-2 px-1">
        {weekData.map((day, idx) => (
          <span key={idx} className={`text-[10px] font-black text-center ${day.isToday ? 'text-accent/80' : 'text-gray-500'}`}>
            {day.label}
          </span>
        ))}
      </div>

      {/* 7-Day Nodes Grid - Fluid & Aspect-Square */}
      <div className="grid grid-cols-7 w-full gap-1 mb-6 px-1">
        {weekData.map((day, idx) => (
          <div 
            key={idx}
            className={`
              w-full aspect-square max-w-[32px] mx-auto rounded-lg flex items-center justify-center transition-all duration-300
              ${day.status === 'completed' 
                ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]' 
                : day.status === 'missed'
                  ? 'bg-red-500/10 border border-red-500/20'
                  : 'bg-white/5 border border-white/10'
              }
              ${day.isToday ? 'ring-1 ring-inset ring-accent/50 bg-accent/10' : ''}
            `}
          >
            {day.status === 'completed' ? (
              <Trophy size={14} className="text-black fill-current" />
            ) : null}
          </div>
        ))}
      </div>

      {/* Daily Action CTA Section */}
      <div className="rounded-2xl bg-black/30 p-3 border border-white/5 hover:border-white/10 transition-colors">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-accent/10 p-2 text-accent">
            <Trophy size={16} className="fill-current" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-gray-100">Daily Target</p>
            <p className="text-[10px] text-gray-500 leading-tight mt-0.5 font-medium">
              Win 1 Battle today to keep your streak alive!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsistencyCalendar;
