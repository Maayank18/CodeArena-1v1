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
                    <div className="flex items-center gap-1.5 ml-auto sm:ml-0 bg-[var(--vz-bg-secondary)] p-1 rounded-lg border vz-border">
                        <Gauge
                            size={12}
                            className="shrink-0 ml-1"
                            style={{ color: 'var(--vz-accent)' }}
                        />
                        <div className="flex">
                            {speedOptions.map((opt, idx) => (
                                <button
                                    key={opt.label}
                                    onClick={() => onSpeedChange(idx)}
                                    className={`px-2 py-0.5 text-[10px] font-bold font-mono transition-all rounded-md ${
                                        speedIndex === idx ? 'bg-[var(--vz-accent)] text-white shadow-sm' : 'text-[var(--vz-text-muted)] hover:text-[var(--vz-text-primary)]'
                                    }`}
                                >
                                    {opt.label.replace('x', '')}
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
                        className="flex items-center gap-0 sm:gap-0.5 rounded-xl border p-1 shrink-0 shadow-sm"
                        style={{
                            background: 'var(--vz-bg-secondary)',
                            borderColor: 'var(--vz-border)',
                        }}
                    >
                        {/* Jump to start */}
                        <div className="hidden xs:block">
                            <StepBtn
                                onClick={() => { onPause(); setCurrentStep(0); }}
                                disabled={isAtStart}
                                title="Jump to Start  (Home)"
                            >
                                <ChevronFirst size={16} />
                            </StepBtn>
                        </div>

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
                            className="w-10 h-9 flex items-center justify-center rounded-lg
                                       text-white transition-all active:scale-90
                                       disabled:opacity-40 disabled:cursor-not-allowed shadow-md mx-1"
                            style={{
                                background: isAtEnd && !isPlaying
                                    ? 'var(--vz-bg-hover)'
                                    : 'linear-gradient(135deg, var(--vz-accent), var(--vz-accent-glow))',
                                boxShadow: isPlaying
                                    ? '0 4px 12px var(--vz-accent-glow)'
                                    : '0 2px 8px rgba(0,0,0,0.1)',
                            }}
                            title={isPlaying ? 'Pause  (Space)' : 'Play  (Space)'}
                        >
                            {isPlaying
                                ? <Pause  size={18} fill="currentColor" />
                                : <Play   size={18} fill="currentColor" className="ml-0.5" />
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
                        <div className="hidden xs:block">
                            <StepBtn
                                onClick={() => { onPause(); setCurrentStep(totalSteps - 1); }}
                                disabled={isAtEnd}
                                title="Jump to End"
                            >
                                <ChevronLast size={16} />
                            </StepBtn>
                        </div>
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
// V 1.5
