// FILE: frontend/src/components/ChatWidget.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Bot, X, Send, Loader2, RotateCcw,
    ChevronRight, Zap, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CodyIcon from '../assets/CodyAI.png';
import api from '../api.js';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_FREE_MESSAGES = 7;
const MAX_CHARS = 300;
const MAX_STORED_MESSAGES = 30;
const getStorageKey = (username) => `codearena_chat_${username}`;

const FAQ_ITEMS = [
    { question: 'How do I start a 1v1 battle?',    label: 'Start a battle'    },
    { question: 'How does ELO rating work?',        label: 'ELO rating'        },
    { question: 'What languages are supported?',    label: 'Languages'         },
    { question: 'How does the scoring work?',       label: 'Scoring system'    },
    { question: 'How do I use the visualizer?',     label: 'Visualizer'        },
    { question: 'How can I improve my rank?',       label: 'Improve rank'      },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const TypingIndicator = () => (
    <div className="flex items-start gap-3">
        <div className="shrink-0">
            <AnimatedCodyAvatar size="w-9 h-9" />
        </div>
        <div className="bg-[#222222] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
            <div className="flex gap-1.5 items-center h-4">
                {[0, 150, 300].map((delay) => (
                    <span
                        key={delay}
                        className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                    />
                ))}
            </div>
        </div>
    </div>
);

const AnimatedCodyAvatar = ({ size = "w-10 h-10" }) => (
    <motion.img
        src={CodyIcon}
        alt="Cody AI"
        className={`${size} object-contain origin-bottom`}
        animate={{ scaleY: [1, 1, 1, 0.7, 1] }}
        transition={{ 
            duration: 4, 
            repeat: Infinity, 
            times: [0, 0.2, 0.94, 0.97, 1],
            ease: "easeInOut"
        }}
    />
);

const BotAvatar = () => (
    <div className="relative shrink-0 flex items-center justify-center">
        <AnimatedCodyAvatar size="w-12 h-12" />
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#121212] rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
    </div>
);

const MessageBubble = ({ msg }) => {
    const isUser = msg.role === 'user';
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            {!isUser && (
                <div className="shrink-0 mt-1">
                    <AnimatedCodyAvatar size="w-9 h-9" />
                </div>
            )}
            <div
                className={`px-4 py-2.5 text-sm leading-relaxed break-words ${
                    isUser
                        ? 'bg-emerald-600 text-white rounded-2xl rounded-br-sm max-w-[85%] self-end shadow-lg shadow-emerald-900/20'
                        : msg.isError
                            ? 'bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl rounded-tl-sm max-w-[85%]'
                            : 'bg-[#222222] border border-white/5 text-gray-200 rounded-2xl rounded-bl-sm max-w-[85%] self-start'
                }`}
            >
                {msg.isError && (
                    <AlertCircle size={13} className="inline mr-1.5 mb-0.5 opacity-70" />
                )}
                {msg.content}
            </div>
        </div>
    );
};

// ─── Main Widget ──────────────────────────────────────────────────────────────
const ChatWidget = ({ user }) => {
    const { isDark } = useTheme();
    const [isOpen, setIsOpen]             = useState(false);
    const [messages, setMessages]         = useState([]);
    const [inputValue, setInputValue]     = useState('');
    const [isTyping, setIsTyping]         = useState(false);
    const [messageCount, setMessageCount] = useState(0);
    const [hasBadge, setHasBadge]         = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef       = useRef(null);

    const storageKey = user?.username ? getStorageKey(user.username) : null;

    // ── Load persisted chat on mount ──────────────────────────────────────────
    useEffect(() => {
        if (!storageKey) return;
        try {
            const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
            if (!stored) return;
            if (Array.isArray(stored.messages)) setMessages(stored.messages);
            if (typeof stored.count === 'number') setMessageCount(stored.count);
        } catch (_) { /* corrupted storage — start fresh */ }
    }, [storageKey]);

    // ── Persist chat ──────────────────────────────────────────────────────────
    const persist = useCallback((msgs, count) => {
        if (!storageKey) return;
        try {
            localStorage.setItem(storageKey, JSON.stringify({
                messages: msgs.slice(-MAX_STORED_MESSAGES),
                count,
            }));
        } catch (_) { /* storage full — silently ignore */ }
    }, [storageKey]);

    // ── Auto-scroll ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping, isOpen]);

    // ── Focus input on open ───────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 120);
        }
    }, [isOpen]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleOpen  = () => { setIsOpen(true);  setHasBadge(false); };
    const handleClose = () => setIsOpen(false);

    const handleClearChat = () => {
        setMessages([]);
        persist([], messageCount);
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value.slice(0, MAX_CHARS));
        // Auto-resize textarea
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
    };

    const sendMessage = useCallback(async (text) => {
        const trimmed = text.trim();
        if (!trimmed || isTyping || messageCount >= MAX_FREE_MESSAGES) return;

        const userMsg = {
            id: `u_${Date.now()}`,
            role: 'user',
            content: trimmed,
            timestamp: Date.now(),
        };

        const newCount    = messageCount + 1;
        const withUser    = [...messages, userMsg];

        setMessages(withUser);
        setMessageCount(newCount);
        setInputValue('');
        setIsTyping(true);

        // Reset textarea height
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }

        // Build history payload: last 4 messages (= 2 conversation turns)
        const historyForApi = messages.slice(-4).map(({ role, content }) => ({ role, content }));

        // User context for personalised responses
        const userContext = user ? {
            username:      user.username,
            rating:        user.rating        || 1000,
            wins:          user.stats?.wins   || 0,
            losses:        user.stats?.losses || 0,
            matchesPlayed: user.stats?.matchesPlayed || 0,
        } : null;

        try {
            const { data } = await api.post('/chat', {
                message: trimmed,
                conversationHistory: historyForApi,
                userContext,
            });

            const aiMsg = {
                id: `a_${Date.now()}`,
                role: 'assistant',
                content: data.reply,
                timestamp: Date.now(),
            };

            const finalMessages = [...withUser, aiMsg];
            setMessages(finalMessages);
            persist(finalMessages, newCount);

            if (!isOpen) setHasBadge(true);

        } catch (error) {
            const errMsg = {
                id: `e_${Date.now()}`,
                role: 'assistant',
                content: error.response?.data?.message || "Couldn't connect right now. Please try again!",
                timestamp: Date.now(),
                isError: true,
            };
            const finalMessages = [...withUser, errMsg];
            setMessages(finalMessages);
            persist(finalMessages, newCount);
        } finally {
            setIsTyping(false);
        }
    }, [messages, messageCount, isTyping, user, isOpen, persist]);

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(inputValue);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputValue);
        }
    };

    // ── Derived state ─────────────────────────────────────────────────────────
    const isLimitReached = messageCount >= MAX_FREE_MESSAGES;
    const remaining      = Math.max(0, MAX_FREE_MESSAGES - messageCount);
    const showFAQ        = messages.length === 0;
    const charsLeft      = MAX_CHARS - inputValue.length;

    return (
        <>
            {/* ── Floating Button ────────────────────────────────────────── */}
            <button
                onClick={isOpen ? handleClose : handleOpen}
                aria-label="Toggle AI assistant"
                className="fixed bottom-6 right-2 md:bottom-8 md:right-4 z-50 w-20 h-20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none"
            >
                <div className={`transition-all duration-200 ${isOpen ? 'rotate-90 scale-90' : 'rotate-0 scale-100'} w-full h-full flex items-center justify-center`}>
                    {isOpen ? (
                        <div className="w-14 h-14 rounded-full bg-[#121212] border border-white/10 flex items-center justify-center shadow-2xl">
                             <X size={32} className="text-white" />
                        </div>
                    ) : (
                        <AnimatedCodyAvatar size="w-full h-full" />
                    )}
                </div>

                {/* Notification badge */}
                {hasBadge && !isOpen && (
                    <span className="absolute top-2 right-2 w-4.5 h-4.5 bg-red-500 rounded-full border-2 border-[#121212] animate-pulse" />
                )}
            </button>

            {/* ── Chat Panel ─────────────────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="fixed bottom-24 right-4 md:bottom-28 md:right-6 w-[calc(100vw-32px)] sm:w-[440px] bg-[#121212]/95 backdrop-blur-xl border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.6)] rounded-[24px] flex flex-col overflow-hidden z-50 origin-bottom-right"
                        style={{
                            height: 'min(650px, 75dvh)',
                            maxHeight: 'calc(100dvh - 140px)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5 shrink-0">
                            <div className="flex items-center gap-3">
                                <BotAvatar />
                                <div className="flex flex-col">
                                    <p className="text-white font-bold tracking-wide leading-tight">Cody AI</p>
                                    <p className="text-xs text-green-400 font-medium mt-0.5 flex items-center gap-1">
                                        AI Mentor
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleClearChat}
                                    title="Clear conversation"
                                    className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <RotateCcw size={16} />
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-[#0a0a0a]/50 min-h-0 chat-scroll">
                            {showFAQ ? (
                                <div className="space-y-6 py-2">
                                    <div className="flex items-start gap-3">
                                        <div className="shrink-0">
                                            <AnimatedCodyAvatar size="w-12 h-12" />
                                        </div>
                                        <div className="bg-[#222222] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] shadow-lg">
                                            <p className="text-sm text-gray-200 leading-relaxed">
                                                Hey{user?.username ? <span className="text-emerald-400 font-semibold"> {user.username}</span> : ''}! 👋 I'm <span className="text-emerald-400 font-semibold">Cody AI</span>. Ask me anything about CodeArena 1v1.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pl-[52px] space-y-3">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold opacity-60">
                                            Quick questions
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {FAQ_ITEMS.map((item) => (
                                                <button
                                                    key={item.question}
                                                    onClick={() => sendMessage(item.question)}
                                                    disabled={isLimitReached}
                                                    className="text-xs px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 text-gray-300 hover:text-emerald-400 rounded-full transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed group"
                                                >
                                                    {item.label}
                                                    <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg) => (
                                        <MessageBubble key={msg.id} msg={msg} />
                                    ))}
                                    {isTyping && <TypingIndicator />}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Limit reached banner */}
                        {isLimitReached && (
                            <div className="mx-5 mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shrink-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Zap size={14} className="text-emerald-400 shrink-0" />
                                    <span className="text-sm font-bold text-emerald-400">Free limit reached</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-3">
                                    Upgrade to Pro for unlimited AI assistance.
                                </p>
                                <button
                                    onClick={() => toast('Pro Plan coming soon! 🚀', { icon: '⚡' })}
                                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-[#121212] text-xs font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                                >
                                    Upgrade to Pro
                                </button>
                            </div>
                        )}

                        {/* Input area */}
                        {!isLimitReached && (
                            <div className="p-4 bg-[#121212] border-t border-white/10 shrink-0">
                                <form
                                    onSubmit={handleSubmit}
                                    className="flex items-center bg-[#1e1e1e] rounded-full px-2 py-1.5 border border-white/5 focus-within:border-white/20 transition-colors"
                                >
                                    <textarea
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask about CodeArena…"
                                        rows={1}
                                        disabled={isTyping}
                                        className="flex-1 bg-transparent text-white text-sm px-3 outline-none placeholder-gray-500 resize-none py-1 min-h-[32px] max-h-[100px]"
                                    />
                                    
                                    <button
                                        type="submit"
                                        disabled={!inputValue.trim() || isTyping}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                    >
                                        {isTyping
                                            ? <Loader2 size={16} className="animate-spin" />
                                            : <Send size={16} />
                                        }
                                    </button>
                                </form>
                                {inputValue.length > 200 && (
                                    <div className={`mt-2 text-[10px] font-mono text-center ${charsLeft < 30 ? 'text-red-400' : 'text-gray-500'}`}>
                                        {charsLeft} characters remaining
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-[2px]"
                    onClick={handleClose}
                />
            )}

            <style>{`
                .chat-scroll::-webkit-scrollbar { width: 4px; }
                .chat-scroll::-webkit-scrollbar-track { background: transparent; }
                .chat-scroll::-webkit-scrollbar-thumb { background: ${isDark ? '#262626' : '#e5e5e5'}; border-radius: 2px; }
                .chat-scroll::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#333' : '#d4d4d4'}; }
            `}</style>
        </>
    );
};

export default ChatWidget;
// V 1.5
