// // src/components/Visualizer/ControlBar.jsx
// import React from 'react';
// import { 
//     Play, Pause, SkipBack, SkipForward, 
//     PlayCircle, RotateCcw, ChevronFirst, ChevronLast 
// } from 'lucide-react';

// const ControlBar = ({ 
//     currentStep, 
//     totalSteps, 
//     setCurrentStep, 
//     isPlaying, 
//     setIsPlaying, 
//     onRun,
//     loading 
// }) => {
    
//     const handleSliderChange = (e) => {
//         const val = parseInt(e.target.value);
//         setCurrentStep(Math.max(0, Math.min(val, totalSteps - 1)));
//         setIsPlaying(false); // Pause when manually scrubbing
//     };

//     const hasTrace = totalSteps > 0;
//     const isAtEnd = currentStep >= totalSteps - 1;
//     const isAtStart = currentStep === 0;

//     return (
//         <div className="flex items-center gap-6 h-full text-gray-300">
            
//             {/* 1. PRIMARY RUN BUTTON */}
//             <button 
//                 onClick={onRun}
//                 disabled={loading}
//                 className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg hover:shadow-green-500/20 active:scale-95 disabled:scale-100"
//             >
//                 <PlayCircle size={20} />
//                 <span>{loading ? 'Running...' : 'Run & Visualize'}</span>
//             </button>

//             {/* 2. PLAYBACK CONTROLS (Only show when we have trace data) */}
//             {hasTrace && (
//                 <>
//                     <div className="h-8 w-px bg-gray-700" />
                    
//                     <div className="flex items-center gap-1 bg-gray-800/50 p-1 rounded-lg border border-gray-700">
//                         {/* Jump to Start */}
//                         <button 
//                             onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
//                             disabled={isAtStart}
//                             className="p-2 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded text-gray-400 hover:text-white transition-colors"
//                             title="Jump to Start"
//                         >
//                             <ChevronFirst size={18} />
//                         </button>

//                         {/* Step Backward */}
//                         <button 
//                             onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
//                             disabled={isAtStart}
//                             className="p-2 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded text-gray-400 hover:text-white transition-colors"
//                             title="Previous Step"
//                         >
//                             <SkipBack size={18} />
//                         </button>

//                         {/* Play/Pause */}
//                         <button 
//                             onClick={() => setIsPlaying(!isPlaying)}
//                             disabled={isAtEnd}
//                             className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded shadow-md transition-colors w-10 flex justify-center items-center"
//                             title={isPlaying ? 'Pause' : 'Play'}
//                         >
//                             {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
//                         </button>

//                         {/* Step Forward */}
//                         <button 
//                             onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
//                             disabled={isAtEnd}
//                             className="p-2 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded text-gray-400 hover:text-white transition-colors"
//                             title="Next Step"
//                         >
//                             <SkipForward size={18} />
//                         </button>

//                         {/* Jump to End */}
//                         <button 
//                             onClick={() => { setCurrentStep(totalSteps - 1); setIsPlaying(false); }}
//                             disabled={isAtEnd}
//                             className="p-2 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded text-gray-400 hover:text-white transition-colors"
//                             title="Jump to End"
//                         >
//                             <ChevronLast size={18} />
//                         </button>
//                     </div>

//                     {/* 3. TIMELINE SCRUBBER */}
//                     <div className="flex-1 flex items-center gap-4">
//                         <span className="text-xs font-mono text-gray-400 min-w-[40px] text-right tabular-nums">
//                             {currentStep + 1}
//                         </span>
                        
//                         <div className="relative flex-1 group">
//                             <input
//                                 type="range"
//                                 min="0"
//                                 max={Math.max(0, totalSteps - 1)}
//                                 value={currentStep}
//                                 onChange={handleSliderChange}
//                                 className="w-full h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer 
//                                            [&::-webkit-slider-thumb]:appearance-none 
//                                            [&::-webkit-slider-thumb]:w-3 
//                                            [&::-webkit-slider-thumb]:h-3 
//                                            [&::-webkit-slider-thumb]:rounded-full 
//                                            [&::-webkit-slider-thumb]:bg-blue-500 
//                                            [&::-webkit-slider-thumb]:cursor-pointer
//                                            [&::-webkit-slider-thumb]:shadow-lg
//                                            [&::-webkit-slider-thumb]:hover:bg-blue-400
//                                            [&::-webkit-slider-thumb]:transition-all"
//                                 style={{
//                                     background: `linear-gradient(to right, 
//                                         #3b82f6 0%, 
//                                         #3b82f6 ${(currentStep / (totalSteps - 1)) * 100}%, 
//                                         #374151 ${(currentStep / (totalSteps - 1)) * 100}%, 
//                                         #374151 100%)`
//                                 }}
//                             />
                            
//                             {/* Progress percentage tooltip */}
//                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
//                                 <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
//                                     {Math.round((currentStep / Math.max(totalSteps - 1, 1)) * 100)}%
//                                 </div>
//                             </div>
//                         </div>
                        
//                         <span className="text-xs font-mono text-gray-400 min-w-[40px] tabular-nums">
//                             {totalSteps}
//                         </span>
//                     </div>

//                     {/* 4. RESET BUTTON */}
//                     <button 
//                         onClick={() => { setIsPlaying(false); setCurrentStep(0); }}
//                         className="p-2 hover:bg-gray-800 rounded-full text-gray-500 hover:text-red-400 transition-colors"
//                         title="Reset to Start"
//                     >
//                         <RotateCcw size={18} />
//                     </button>
//                 </>
//             )}

//             {/* Empty State Message */}
//             {!hasTrace && (
//                 <span className="text-sm text-gray-600 italic ml-4">
//                     Click "Run & Visualize" to see your code in action
//                 </span>
//             )}
//         </div>
//     );
// };

// export default ControlBar;



































// FILE: frontend/src/components/Visualizer/ControlBar.jsx
// FULLY OPTIMIZED — Bug fixes, speed control, responsive layout, theme-aware
import React, { useCallback } from 'react';
import {
    Play, Pause, SkipBack, SkipForward,
    PlayCircle, RotateCcw, ChevronFirst, ChevronLast,
    Gauge,
} from 'lucide-react';

/**
 * Props:
 *  currentStep    {number}   - Current trace index
 *  totalSteps     {number}   - Length of trace array
 *  setCurrentStep {function} - Jump to an arbitrary step
 *  isPlaying      {boolean}  - Playback state
 *  onPlayPause    {function} - ✅ FIXED: clean toggle (no more broken setIsPlaying(!isPlaying))
 *  onPause        {function} - ✅ FIXED: pure pause, used when scrubbing / jumping
 *  onRun          {function} - Execute code
 *  loading        {boolean}  - Execution in progress
 *  speedIndex     {number}   - Index into speedOptions array
 *  onSpeedChange  {function} - (index) => void
 *  speedOptions   {array}    - [{ label, ms }]
 */
const ControlBar = ({
    currentStep,
    totalSteps,
    setCurrentStep,
    isPlaying,
    onPlayPause,
    onPause,
    onRun,
    loading,
    speedIndex = 1,
    onSpeedChange,
    speedOptions = [],
}) => {
    const hasTrace  = totalSteps > 0;
    const isAtEnd   = currentStep >= totalSteps - 1;
    const isAtStart = currentStep === 0;

    // ── FIXED: Slider — no division-by-zero, pauses cleanly ─────────────────
    const handleSliderChange = useCallback((e) => {
        const val = Math.max(0, Math.min(parseInt(e.target.value, 10), totalSteps - 1));
        onPause();                  // stop playback while scrubbing
        setCurrentStep(val);
    }, [onPause, setCurrentStep, totalSteps]);

    // ── FIXED: NaN-safe progress % ───────────────────────────────────────────
    const progressPct = totalSteps <= 1
        ? 0
        : Math.round((currentStep / (totalSteps - 1)) * 100);

    // Slider fill style — safe from NaN
    const sliderStyle = {
        background: `linear-gradient(to right,
            var(--vz-accent) 0%,
            var(--vz-accent) ${progressPct}%,
            var(--vz-border) ${progressPct}%,
            var(--vz-border) 100%)`,
    };

    return (
        /*
         * Layout strategy:
         *   Mobile  (<sm): Stack vertically — Run button full-width, then controls row
         *   Tablet  (sm):  Two rows — Row1: run+speed, Row2: step controls + scrubber
         *   Desktop (lg):  Single row, everything inline
         */
        <div className="w-full flex flex-col gap-2 sm:gap-2.5">

            {/* ── ROW 1: Run button + Speed selector ──────────────────────── */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">

                {/* Run & Visualize */}
                <button
                    onClick={onRun}
                    disabled={loading}
                    className="run-btn flex items-center justify-center gap-2 px-5 py-2
                               rounded-full font-bold text-sm text-white transition-all
                               active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                               disabled:scale-100 shadow-md w-full sm:w-auto"
                    style={{
                        background: loading
                            ? 'var(--vz-bg-hover)'
                            : 'linear-gradient(135deg, #2ea043, #3fb950)',
                        boxShadow: loading ? 'none' : '0 2px 12px rgba(63,185,80,0.3)',
                    }}
                >
                    {loading
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Running…</span></>
                        : <><PlayCircle size={18} /><span>Run & Visualize</span></>
                    }
                </button>

                {/* Speed selector — only visible when trace exists */}
                {hasTrace && speedOptions.length > 0 && (
                    <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                        <Gauge
                            size={13}
                            className="shrink-0"
                            style={{ color: 'var(--vz-text-muted)' }}
                        />
                        <div
                            className="flex rounded-lg border overflow-hidden"
                            style={{ borderColor: 'var(--vz-border)' }}
                        >
                            {speedOptions.map((opt, idx) => (
                                <button
                                    key={opt.label}
                                    onClick={() => onSpeedChange(idx)}
                                    className="px-2.5 py-1 text-[11px] font-bold font-mono
                                               transition-colors"
                                    style={{
                                        background: speedIndex === idx
                                            ? 'var(--vz-accent)'
                                            : 'var(--vz-bg-secondary)',
                                        color: speedIndex === idx
                                            ? '#fff'
                                            : 'var(--vz-text-muted)',
                                        borderRight: idx < speedOptions.length - 1
                                            ? '1px solid var(--vz-border)'
                                            : 'none',
                                    }}
                                    title={`Playback speed: ${opt.label} (${opt.ms}ms/step)`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty state hint */}
                {!hasTrace && (
                    <span
                        className="text-xs italic ml-2"
                        style={{ color: 'var(--vz-text-muted)' }}
                    >
                        Click "Run & Visualize" to start
                    </span>
                )}
            </div>

            {/* ── ROW 2: Step controls + Scrubber (only when trace exists) ── */}
            {hasTrace && (
                <div className="flex items-center gap-2 sm:gap-3 w-full">

                    {/* Step control group */}
                    <div
                        className="flex items-center gap-0.5 rounded-lg border p-0.5 shrink-0"
                        style={{
                            background: 'var(--vz-bg-secondary)',
                            borderColor: 'var(--vz-border)',
                        }}
                    >
                        {/* Jump to start */}
                        <StepBtn
                            onClick={() => { onPause(); setCurrentStep(0); }}
                            disabled={isAtStart}
                            title="Jump to Start  (Home)"
                        >
                            <ChevronFirst size={16} />
                        </StepBtn>

                        {/* Step back */}
                        <StepBtn
                            onClick={() => { onPause(); setCurrentStep(Math.max(0, currentStep - 1)); }}
                            disabled={isAtStart}
                            title="Previous Step  (←)"
                        >
                            <SkipBack size={16} />
                        </StepBtn>

                        {/* Play / Pause */}
                        <button
                            onClick={onPlayPause}
                            disabled={isAtEnd && !isPlaying}
                            className="w-9 h-8 flex items-center justify-center rounded-md
                                       text-white transition-all active:scale-90
                                       disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                background: isAtEnd && !isPlaying
                                    ? 'var(--vz-bg-hover)'
                                    : 'var(--vz-accent)',
                                boxShadow: isPlaying
                                    ? '0 0 10px var(--vz-accent-glow)'
                                    : 'none',
                            }}
                            title={isPlaying ? 'Pause  (Space)' : 'Play  (Space)'}
                        >
                            {isPlaying
                                ? <Pause  size={16} fill="currentColor" />
                                : <Play   size={16} fill="currentColor" />
                            }
                        </button>

                        {/* Step forward */}
                        <StepBtn
                            onClick={() => { onPause(); setCurrentStep(Math.min(totalSteps - 1, currentStep + 1)); }}
                            disabled={isAtEnd}
                            title="Next Step  (→)"
                        >
                            <SkipForward size={16} />
                        </StepBtn>

                        {/* Jump to end */}
                        <StepBtn
                            onClick={() => { onPause(); setCurrentStep(totalSteps - 1); }}
                            disabled={isAtEnd}
                            title="Jump to End"
                        >
                            <ChevronLast size={16} />
                        </StepBtn>
                    </div>

                    {/* ── Scrubber ──────────────────────────────────────── */}
                    <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">

                        {/* Step counter */}
                        <span
                            className="text-[11px] font-mono tabular-nums shrink-0 hidden sm:block"
                            style={{ color: 'var(--vz-text-muted)' }}
                        >
                            {currentStep + 1}
                        </span>

                        {/* Slider + tooltip */}
                        <div className="relative flex-1 group min-w-0">
                            <input
                                type="range"
                                min={0}
                                max={Math.max(0, totalSteps - 1)}
                                value={currentStep}
                                onChange={handleSliderChange}
                                className="vz-slider w-full h-1.5 rounded-full appearance-none
                                           cursor-pointer outline-none"
                                style={sliderStyle}
                                aria-label="Playback position"
                            />

                            {/* Hover tooltip */}
                            <div
                                className="absolute -top-7 pointer-events-none
                                           opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{
                                    left: `${progressPct}%`,
                                    transform: 'translateX(-50%)',
                                }}
                            >
                                <div
                                    className="text-[10px] font-mono font-bold px-1.5 py-0.5
                                               rounded shadow-lg whitespace-nowrap"
                                    style={{
                                        background: 'var(--vz-bg-hover)',
                                        color: 'var(--vz-text-primary)',
                                        border: '1px solid var(--vz-border)',
                                    }}
                                >
                                    {progressPct}% · step {currentStep + 1}
                                </div>
                            </div>
                        </div>

                        {/* Total steps */}
                        <span
                            className="text-[11px] font-mono tabular-nums shrink-0 hidden sm:block"
                            style={{ color: 'var(--vz-text-muted)' }}
                        >
                            {totalSteps}
                        </span>

                        {/* Mobile compact counter */}
                        <span
                            className="text-[11px] font-mono tabular-nums shrink-0 sm:hidden"
                            style={{ color: 'var(--vz-text-muted)' }}
                        >
                            {currentStep + 1}/{totalSteps}
                        </span>
                    </div>

                    {/* Reset */}
                    <button
                        onClick={() => { onPause(); setCurrentStep(0); }}
                        className="p-1.5 rounded-lg border transition-colors shrink-0
                                   hover:text-red-400"
                        style={{
                            color: 'var(--vz-text-muted)',
                            borderColor: 'var(--vz-border)',
                            background: 'var(--vz-bg-secondary)',
                        }}
                        title="Reset to Start"
                    >
                        <RotateCcw size={15} />
                    </button>
                </div>
            )}

            {/* Slider thumb CSS — can't do with Tailwind alone */}
            <style>{`
                .vz-slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: var(--vz-accent);
                    cursor: pointer;
                    border: 2px solid var(--vz-bg-primary);
                    box-shadow: 0 0 0 1px var(--vz-accent);
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }
                .vz-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.25);
                    box-shadow: 0 0 0 3px var(--vz-accent-glow);
                }
                .vz-slider::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: var(--vz-accent);
                    cursor: pointer;
                    border: 2px solid var(--vz-bg-primary);
                }
            `}</style>
        </div>
    );
};

// ── Shared step button ────────────────────────────────────────────────────────
const StepBtn = ({ onClick, disabled, title, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className="w-8 h-8 flex items-center justify-center rounded-md
                   transition-all active:scale-90
                   disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
            color: disabled ? 'var(--vz-text-muted)' : 'var(--vz-text-primary)',
        }}
        onMouseEnter={e => {
            if (!disabled) e.currentTarget.style.background = 'var(--vz-bg-hover)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
        }}
    >
        {children}
    </button>
);

export default ControlBar;