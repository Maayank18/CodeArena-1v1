// src/components/Visualizer/ControlBar.jsx
import React from 'react';
import { 
    Play, Pause, SkipBack, SkipForward, 
    PlayCircle, RotateCcw, ChevronFirst, ChevronLast 
} from 'lucide-react';

const ControlBar = ({ 
    currentStep, 
    totalSteps, 
    setCurrentStep, 
    isPlaying, 
    setIsPlaying, 
    onRun,
    loading 
}) => {
    
    const handleSliderChange = (e) => {
        const val = parseInt(e.target.value);
        setCurrentStep(Math.max(0, Math.min(val, totalSteps - 1)));
        setIsPlaying(false); // Pause when manually scrubbing
    };

    const hasTrace = totalSteps > 0;
    const isAtEnd = currentStep >= totalSteps - 1;
    const isAtStart = currentStep === 0;

    return (
        <div className="flex items-center gap-6 h-full text-gray-300">
            
            {/* 1. PRIMARY RUN BUTTON */}
            <button 
                onClick={onRun}
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg hover:shadow-green-500/20 active:scale-95 disabled:scale-100"
            >
                <PlayCircle size={20} />
                <span>{loading ? 'Running...' : 'Run & Visualize'}</span>
            </button>

            {/* 2. PLAYBACK CONTROLS (Only show when we have trace data) */}
            {hasTrace && (
                <>
                    <div className="h-8 w-px bg-gray-700" />
                    
                    <div className="flex items-center gap-1 bg-gray-800/50 p-1 rounded-lg border border-gray-700">
                        {/* Jump to Start */}
                        <button 
                            onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
                            disabled={isAtStart}
                            className="p-2 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded text-gray-400 hover:text-white transition-colors"
                            title="Jump to Start"
                        >
                            <ChevronFirst size={18} />
                        </button>

                        {/* Step Backward */}
                        <button 
                            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                            disabled={isAtStart}
                            className="p-2 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded text-gray-400 hover:text-white transition-colors"
                            title="Previous Step"
                        >
                            <SkipBack size={18} />
                        </button>

                        {/* Play/Pause */}
                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            disabled={isAtEnd}
                            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded shadow-md transition-colors w-10 flex justify-center items-center"
                            title={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                        </button>

                        {/* Step Forward */}
                        <button 
                            onClick={() => setCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
                            disabled={isAtEnd}
                            className="p-2 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded text-gray-400 hover:text-white transition-colors"
                            title="Next Step"
                        >
                            <SkipForward size={18} />
                        </button>

                        {/* Jump to End */}
                        <button 
                            onClick={() => { setCurrentStep(totalSteps - 1); setIsPlaying(false); }}
                            disabled={isAtEnd}
                            className="p-2 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded text-gray-400 hover:text-white transition-colors"
                            title="Jump to End"
                        >
                            <ChevronLast size={18} />
                        </button>
                    </div>

                    {/* 3. TIMELINE SCRUBBER */}
                    <div className="flex-1 flex items-center gap-4">
                        <span className="text-xs font-mono text-gray-400 min-w-[40px] text-right tabular-nums">
                            {currentStep + 1}
                        </span>
                        
                        <div className="relative flex-1 group">
                            <input
                                type="range"
                                min="0"
                                max={Math.max(0, totalSteps - 1)}
                                value={currentStep}
                                onChange={handleSliderChange}
                                className="w-full h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer 
                                           [&::-webkit-slider-thumb]:appearance-none 
                                           [&::-webkit-slider-thumb]:w-3 
                                           [&::-webkit-slider-thumb]:h-3 
                                           [&::-webkit-slider-thumb]:rounded-full 
                                           [&::-webkit-slider-thumb]:bg-blue-500 
                                           [&::-webkit-slider-thumb]:cursor-pointer
                                           [&::-webkit-slider-thumb]:shadow-lg
                                           [&::-webkit-slider-thumb]:hover:bg-blue-400
                                           [&::-webkit-slider-thumb]:transition-all"
                                style={{
                                    background: `linear-gradient(to right, 
                                        #3b82f6 0%, 
                                        #3b82f6 ${(currentStep / (totalSteps - 1)) * 100}%, 
                                        #374151 ${(currentStep / (totalSteps - 1)) * 100}%, 
                                        #374151 100%)`
                                }}
                            />
                            
                            {/* Progress percentage tooltip */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                    {Math.round((currentStep / Math.max(totalSteps - 1, 1)) * 100)}%
                                </div>
                            </div>
                        </div>
                        
                        <span className="text-xs font-mono text-gray-400 min-w-[40px] tabular-nums">
                            {totalSteps}
                        </span>
                    </div>

                    {/* 4. RESET BUTTON */}
                    <button 
                        onClick={() => { setIsPlaying(false); setCurrentStep(0); }}
                        className="p-2 hover:bg-gray-800 rounded-full text-gray-500 hover:text-red-400 transition-colors"
                        title="Reset to Start"
                    >
                        <RotateCcw size={18} />
                    </button>
                </>
            )}

            {/* Empty State Message */}
            {!hasTrace && (
                <span className="text-sm text-gray-600 italic ml-4">
                    Click "Run & Visualize" to see your code in action
                </span>
            )}
        </div>
    );
};

export default ControlBar;