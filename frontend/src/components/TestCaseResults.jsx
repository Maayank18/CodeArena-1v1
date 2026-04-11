import React from 'react';
import { CheckCircle, XCircle, Lock } from 'lucide-react';

const TestCaseResults = ({ results }) => {
    if (!results || results.length === 0) return null;

    return (
        <div className="mt-4 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Test Results
                </h3>
                <span className="text-[10px] text-gray-500 bg-[#2d2d2d] px-2 py-1 rounded">
                    {results.filter(r => r.passed).length} / {results.length} Passed
                </span>
            </div>
            
            <div className="grid gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {results.map((res, idx) => {
                    const isHidden = res.input === "Hidden Test Case";
                    
                    return (
                        <div key={idx} className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                            res.passed 
                                ? 'bg-green-500/5 border-green-500/20 text-green-400' 
                                : 'bg-red-500/5 border-red-500/20 text-red-400'
                        }`}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                {res.passed ? <CheckCircle size={16} className="shrink-0" /> : <XCircle size={16} className="shrink-0" />}
                                
                                <div className="text-xs font-mono truncate">
                                    <span className="font-bold mr-2 text-gray-500">#{idx + 1}</span>
                                    {isHidden ? (
                                        <span className="inline-flex items-center gap-1 text-gray-500 italic">
                                            <Lock size={10} /> Hidden Case
                                        </span>
                                    ) : (
                                        <span className="text-gray-300" title={res.input}>
                                            {res.input.length > 25 ? res.input.substring(0, 25) + "..." : res.input}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {!res.passed && (
                                <span className="text-[10px] font-bold uppercase bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 shrink-0">
                                    {res.error || "Failed"}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TestCaseResults;
// V 1.5
