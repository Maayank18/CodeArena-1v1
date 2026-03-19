// FILE: frontend/src/components/ChatWidget.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Bot, X, Send, Loader2, RotateCcw,
    ChevronRight, Zap, AlertCircle
} from 'lucide-react';
import api from '../api.js';
import toast from 'react-hot-toast';

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
    <div className="flex items-start gap-2.5">
        <BotAvatar />
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
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

const BotAvatar = () => (
    <div className="w-7 h-7 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0 mt-0.5">
        <Bot size={14} className="text-accent" />
    </div>
);

const MessageBubble = ({ msg }) => {
    const isUser = msg.role === 'user';
    return (
        <div className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
            {!isUser && <BotAvatar />}
            <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                    isUser
                        ? 'bg-accent text-black font-medium rounded-tr-sm max-w-[240px]'
                        : msg.isError
                            ? 'bg-red-500/10 border border-red-500/20 text-red-400 rounded-tl-sm max-w-[270px]'
                            : 'bg-[#1a1a1a] border border-gray-800 text-gray-200 rounded-tl-sm max-w-[270px]'
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
                className="fixed bottom-[104px] right-4 md:bottom-24 md:right-6 z-50 w-14 h-14 rounded-full bg-accent text-black shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                style={{ boxShadow: '0 8px 32px rgba(74,238,136,0.3)' }}
            >
                <div className={`transition-all duration-200 ${isOpen ? 'rotate-90 scale-90' : 'rotate-0 scale-100'}`}>
                    {isOpen ? <X size={22} /> : <Bot size={22} />}
                </div>

                {/* Notification badge */}
                {hasBadge && !isOpen && (
                    <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[var(--bg-primary)] animate-pulse" />
                )}
            </button>

            {/* ── Chat Panel ─────────────────────────────────────────────── */}
            <div
                className={`
                    fixed bottom-[175px] right-4 md:bottom-40 md:right-6 z-50
                    w-[calc(100vw-32px)] md:w-[380px]
                    flex flex-col rounded-2xl overflow-hidden
                    border border-gray-800 bg-[#111]
                    transition-all duration-200 origin-bottom-right
                    ${isOpen
                        ? 'opacity-100 scale-100 pointer-events-auto translate-y-0'
                        : 'opacity-0 scale-95 pointer-events-none translate-y-2'
                    }
                `}
                style={{
                    maxHeight: 'min(540px, calc(100dvh - 220px))',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#0d0d0d] border-b border-gray-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
                            <Bot size={18} className="text-accent" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white leading-none">Arena AI</p>
                            <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                                CodeArena Assistant
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Remaining messages pill */}
                        {!isLimitReached && messageCount > 0 && (
                            <span className="text-[10px] font-mono text-gray-600 bg-gray-900 px-2 py-0.5 rounded-full border border-gray-800 mr-1">
                                {remaining} / {MAX_FREE_MESSAGES}
                            </span>
                        )}
                        <button
                            onClick={handleClearChat}
                            title="Clear conversation"
                            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-gray-800 transition-all"
                        >
                            <RotateCcw size={14} />
                        </button>
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-gray-800 transition-all"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div
                    className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0 chat-scroll"
                    style={{ maxHeight: '320px' }}
                >
                    {showFAQ ? (
                        /* ── Empty state: welcome + FAQ chips ── */
                        <div className="space-y-4">
                            <div className="flex items-start gap-2.5">
                                <BotAvatar />
                                <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[270px]">
                                    <p className="text-sm text-gray-200 leading-relaxed">
                                        Hey{user?.username ? <span className="text-accent font-semibold"> {user.username}</span> : ''}! 👋 I'm <span className="text-accent font-semibold">Arena AI</span>. Ask me anything about CodeArena 1v1.
                                    </p>
                                </div>
                            </div>

                            <div className="pl-9 space-y-2">
                                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
                                    Quick questions
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {FAQ_ITEMS.map((item) => (
                                        <button
                                            key={item.question}
                                            onClick={() => sendMessage(item.question)}
                                            disabled={isLimitReached}
                                            className="text-xs px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-accent/50 text-gray-400 hover:text-accent rounded-full transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {item.label}
                                            <ChevronRight size={10} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ── Conversation ── */
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
                    <div className="mx-3 mb-3 px-4 py-3 bg-accent/10 border border-accent/25 rounded-xl shrink-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap size={14} className="text-accent shrink-0" />
                            <span className="text-sm font-bold text-accent">Free limit reached</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2.5">
                            You've used all {MAX_FREE_MESSAGES} free messages. Upgrade to Pro for unlimited AI assistance.
                        </p>
                        <button
                            onClick={() => toast('Pro Plan coming soon! 🚀', { icon: '⚡', duration: 3000 })}
                            className="w-full py-2 bg-accent text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-all active:scale-95"
                        >
                            Upgrade to Pro
                        </button>
                    </div>
                )}

                {/* Input area */}
                {!isLimitReached && (
                    <form
                        onSubmit={handleSubmit}
                        className="px-3 pb-3 pt-2 border-t border-gray-800 shrink-0 flex gap-2 items-end"
                    >
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about CodeArena…"
                                rows={1}
                                disabled={isTyping}
                                className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-800 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent/50 transition-all resize-none disabled:opacity-50 leading-relaxed"
                                style={{ minHeight: '42px', maxHeight: '96px' }}
                            />
                            {/* Character counter — only show when close to limit */}
                            {inputValue.length > 200 && (
                                <span className={`absolute bottom-1.5 right-2.5 text-[10px] font-mono ${charsLeft < 30 ? 'text-red-400' : 'text-gray-600'}`}>
                                    {charsLeft}
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isTyping}
                            className="w-10 h-10 rounded-xl bg-accent text-black flex items-center justify-center hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                        >
                            {isTyping
                                ? <Loader2 size={16} className="animate-spin" />
                                : <Send size={16} />
                            }
                        </button>
                    </form>
                )}
            </div>

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
                .chat-scroll::-webkit-scrollbar-thumb { background: #262626; border-radius: 2px; }
                .chat-scroll::-webkit-scrollbar-thumb:hover { background: #333; }
            `}</style>
        </>
    );
};

export default ChatWidget;