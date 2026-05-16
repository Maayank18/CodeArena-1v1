import React, { useState, useEffect } from 'react';
import { Sparkles, Lightbulb, Code, Loader2 } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const AIHelpWidget = ({ roomId, problemTitle, currentCode, userTier, initialHelpsUsed = 0 }) => {
    const [helpsUsed, setHelpsUsed] = useState(initialHelpsUsed);
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState('');
    const [activeAction, setActiveAction] = useState(null); // 'hint' or 'check'

    const limits = { 0: 0, 1: 1, 2: 3, 3: 7 };
    const sessionLimit = limits[userTier] || 0;
    const isLimitReached = helpsUsed >= sessionLimit;

    useEffect(() => {
        setHelpsUsed(initialHelpsUsed);
    }, [initialHelpsUsed]);

    const handleAIAction = async (type) => {
        if (userTier === 0) {
            toast.error("AI Help is a Plus+ feature. Please upgrade!", {
                icon: '🔒',
                style: { borderRadius: '10px', background: '#333', color: '#fff' }
            });
            return;
        }

        if (isLimitReached) {
            toast.error("Session AI limit reached. Upgrade for more help!", {
                icon: '⚠️'
            });
            return;
        }

        setIsLoading(true);
        setActiveAction(type);
        setResponse('');

        try {
            const endpoint = type === 'hint' ? '/ai/hint' : '/ai/check-code';
            const payload = { 
                roomId, 
                problemTitle,
                ...(type === 'check' ? { code: currentCode } : {})
            };

            const { data } = await api.post(endpoint, payload);
            
            setResponse(data.reply);
            setHelpsUsed(data.helpsUsed);
        } catch (error) {
            console.error(`[AI HELP] ${type} error:`, error);
            const msg = error.response?.data?.message || "Cody AI is currently resting. Please try again later.";
            toast.error(msg);
        } finally {
            setIsLoading(false);
            setActiveAction(null);
        }
    };

    return (
        <div className="border border-dashed border-white/20 rounded-xl p-5 mt-8 bg-[#121212]/50 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-yellow-400/10 rounded-lg">
                        <Sparkles className="text-yellow-400" size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white tracking-tight">Need a push? Ask Cody AI</h4>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
                            {userTier === 0 ? "Unlock with Plus+" : `Session Usage: ${helpsUsed}/${sessionLimit}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleAIAction('hint')}
                        disabled={isLoading || isLimitReached}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-gray-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
                    >
                        {isLoading && activeAction === 'hint' ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Lightbulb size={14} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                        )}
                        Get Hint
                    </button>
                    
                    <button
                        onClick={() => handleAIAction('check')}
                        disabled={isLoading || isLimitReached}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
                    >
                        {isLoading && activeAction === 'check' ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Code size={14} className="group-hover:scale-110 transition-transform" />
                        )}
                        Check Code
                    </button>
                </div>
            </div>

            {response && (
                <div className="bg-[#1e1e1e] p-5 rounded-xl border-l-[4px] border-emerald-500 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed">
                        <ReactMarkdown>{response}</ReactMarkdown>
                    </div>
                </div>
            )}
            
            {isLoading && !response && (
                <div className="bg-[#1e1e1e]/50 p-6 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-3 animate-pulse">
                    <Loader2 size={24} className="text-emerald-500 animate-spin" />
                    <p className="text-xs text-gray-500 font-medium">Cody AI is analyzing...</p>
                </div>
            )}
        </div>
    );
};

export default AIHelpWidget;
