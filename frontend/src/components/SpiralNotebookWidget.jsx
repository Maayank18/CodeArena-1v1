import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Pin, Undo, Redo, Bold, Italic, Underline,
    List, ListOrdered, Image as ImageIcon, Star,
    Cloud, Loader2, Edit3, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api.js';

const NOTE_RETRY_DELAY_MS = 5000;

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

const normalizeEditorHtml = (html = '') => {
    const trimmed = html.trim();
    if (!trimmed || trimmed === '<br>' || trimmed === '<div><br></div>' || trimmed === '<p><br></p>') {
        return '';
    }
    return trimmed;
};

const escapeHtml = (value = '') => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toEditorHtml = (value = '') => {
    if (!value) return '';

    const trimmed = value.trim();
    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
    if (looksLikeHtml) {
        return normalizeEditorHtml(trimmed);
    }

    return escapeHtml(value).replace(/\n/g, '<br>');
};

const getPlainTextFromHtml = (html = '') => {
    if (typeof window === 'undefined' || !html) return '';

    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent?.replace(/\s+/g, ' ').trim() || '';
};

const buildDraftStorageKey = (type, contextKey, contextTitle) => `codearena_note_draft:${type}:${contextKey || contextTitle}`;

const readDraft = (type, contextKey, contextTitle) => {
    if (typeof window === 'undefined' || !type || !(contextKey || contextTitle)) return null;

    try {
        const raw = window.localStorage.getItem(buildDraftStorageKey(type, contextKey, contextTitle));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const writeDraft = (type, contextKey, contextTitle, content, updatedAt = Date.now()) => {
    if (typeof window === 'undefined' || !type || !(contextKey || contextTitle)) return;

    window.localStorage.setItem(
        buildDraftStorageKey(type, contextKey, contextTitle),
        JSON.stringify({ type, contextKey, contextTitle, content, updatedAt })
    );
};

const clearDraft = (type, contextKey, contextTitle) => {
    if (typeof window === 'undefined' || !type || !(contextKey || contextTitle)) return;
    window.localStorage.removeItem(buildDraftStorageKey(type, contextKey, contextTitle));
};

const syncNoteToServer = async ({ type, contextKey, contextTitle, content }) => {
    return api.post('/notes', { type, contextKey, contextTitle, content });
};

const SpiralNotebookWidget = ({ isOpen, onClose, type, contextKey = '', contextTitle, desktopSide = 'right' }) => {
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [isPinned, setIsPinned] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [hasLocalDraft, setHasLocalDraft] = useState(false);
    const [retryTick, setRetryTick] = useState(0);

    const editorRef = useRef(null);
    const lastSavedContentRef = useRef('');
    const latestContentRef = useRef('');
    const retryTimeoutRef = useRef(null);
    const hydratedNoteKeyRef = useRef('');

    const noteIdentity = `${type}:${contextKey || contextTitle || ''}`;

    const debouncedContent = useDebounce(content, 1200);
    const hasVisibleContent = Boolean(getPlainTextFromHtml(content));

    const clearRetryTimer = useCallback(() => {
        if (retryTimeoutRef.current) {
            window.clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
    }, []);

    const scheduleRetry = useCallback(() => {
        if (retryTimeoutRef.current) return;

        retryTimeoutRef.current = window.setTimeout(() => {
            retryTimeoutRef.current = null;
            setRetryTick((value) => value + 1);
        }, NOTE_RETRY_DELAY_MS);
    }, []);

    const syncEditorContent = useCallback((html) => {
        if (editorRef.current && editorRef.current.innerHTML !== html) {
            editorRef.current.innerHTML = html;
        }
    }, []);

    useEffect(() => {
        if (!isOpen || isLoading) return;
        syncEditorContent(content);
    }, [content, isLoading, isOpen, syncEditorContent]);

    const saveNote = useCallback(async (html, { showToast = false } = {}) => {
        const normalizedContent = normalizeEditorHtml(html);

        if (!type || !contextTitle) return false;
        if (normalizedContent === lastSavedContentRef.current) {
            setHasUnsavedChanges(false);
            setSaveError('');
            return true;
        }

        setIsSaving(true);
        setSaveError('');

        try {
            const { data } = await syncNoteToServer({
                type,
                contextKey,
                contextTitle,
                content: normalizedContent
            });

            if (data.success) {
                clearRetryTimer();
                lastSavedContentRef.current = normalizedContent;
                latestContentRef.current = normalizedContent;
                setContent(normalizedContent);
                setLastSaved(data?.note?.updatedAt ? new Date(data.note.updatedAt) : new Date());
                setHasUnsavedChanges(false);
                setHasLocalDraft(false);
                clearDraft(type, contextKey, contextTitle);
                if (showToast) toast.success('Note saved');
                return true;
            }
        } catch (error) {
            if (error?.message === 'Duplicate request' || error?.code === 'ERR_CANCELED') {
                return false;
            }

            console.error('Failed to save note:', error);
            const status = error.response?.status;
            const errorMsg =
                error.response?.data?.message ||
                (status === 401
                    ? 'Your session expired. Please log in again.'
                    : status === 403
                        ? 'Cloud sync is unavailable for this account right now.'
                        : status && status >= 500
                            ? 'The notes server is temporarily unavailable.'
                            : navigator.onLine
                                ? 'Cloud sync could not be reached right now.'
                                : 'Your internet connection appears offline.');
            writeDraft(type, contextKey, contextTitle, normalizedContent);
            scheduleRetry();
            setHasLocalDraft(true);
            setSaveError(`Saved locally. ${errorMsg}`);
            if (showToast) {
                toast.error(`Save failed. ${errorMsg} Your local draft is safe.`);
            }
            return false;
        } finally {
            setIsSaving(false);
        }

        return false;
    }, [clearRetryTimer, contextKey, contextTitle, scheduleRetry, type]);

    useEffect(() => {
        if (!isOpen) return;
        let isMounted = true;

        const fetchNote = async () => {
            const isSameNoteSession = hydratedNoteKeyRef.current === noteIdentity;
            if (isSameNoteSession && (hasUnsavedChanges || hasLocalDraft || Boolean(saveError))) {
                syncEditorContent(content);
                return;
            }

            setIsLoading(true);
            setSaveError('');
            clearRetryTimer();
            lastSavedContentRef.current = '';
            latestContentRef.current = '';

             const localDraft = readDraft(type, contextKey, contextTitle);
             if (localDraft?.content) {
                const draftContent = toEditorHtml(localDraft.content);
                setContent(draftContent);
                latestContentRef.current = draftContent;
                setHasUnsavedChanges(true);
                setHasLocalDraft(true);
                syncEditorContent(draftContent);
            }

            try {
                const { data } = await api.get('/notes/context', {
                    params: { type, contextKey, contextTitle }
                });

                if (!isMounted) return;

                const remoteUpdatedAt = data?.note?.updatedAt ? new Date(data.note.updatedAt).getTime() : 0;
                const localUpdatedAt = localDraft?.updatedAt || 0;
                const shouldUseLocalDraft = Boolean(localDraft?.content) && localUpdatedAt >= remoteUpdatedAt;
                const nextContent = shouldUseLocalDraft
                    ? toEditorHtml(localDraft.content)
                    : toEditorHtml(data?.note?.content || '');

                setContent(nextContent);
                latestContentRef.current = nextContent;
                lastSavedContentRef.current = shouldUseLocalDraft ? (data?.note?.content || '') : nextContent;
                setLastSaved(data?.note?.updatedAt ? new Date(data.note.updatedAt) : null);
                setHasUnsavedChanges(shouldUseLocalDraft);
                setHasLocalDraft(shouldUseLocalDraft);
                hydratedNoteKeyRef.current = noteIdentity;
                syncEditorContent(nextContent);
            } catch (error) {
                if (!isMounted) return;
                if (error.response?.status !== 404) {
                    console.error('Failed to load note:', error);
                }

                if (!localDraft?.content) {
                    setContent('');
                    latestContentRef.current = '';
                    lastSavedContentRef.current = '';
                    setLastSaved(null);
                    setHasUnsavedChanges(false);
                    setHasLocalDraft(false);
                    syncEditorContent('');
                }

                if (localDraft?.content) {
                    hydratedNoteKeyRef.current = noteIdentity;
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchNote();

        return () => {
            isMounted = false;
        };
    }, [clearRetryTimer, contextKey, contextTitle, isOpen, noteIdentity, syncEditorContent, type]);

    useEffect(() => {
        if (!isOpen || !hasUnsavedChanges) return;
        if (debouncedContent === lastSavedContentRef.current) return;

        saveNote(debouncedContent);
    }, [debouncedContent, hasUnsavedChanges, isOpen, retryTick, saveNote]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleOnline = () => {
            if (hasUnsavedChanges) {
                clearRetryTimer();
                setRetryTick((value) => value + 1);
            }
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [clearRetryTimer, hasUnsavedChanges, isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;

        return () => {
            const pendingContent = normalizeEditorHtml(latestContentRef.current);
            if (!pendingContent || pendingContent === lastSavedContentRef.current) return;

            writeDraft(type, contextKey, contextTitle, pendingContent);
            void syncNoteToServer({ type, contextKey, contextTitle, content: pendingContent })
                .then(() => {
                    clearDraft(type, contextKey, contextTitle);
                })
                .catch(() => {
                    // Keep the local draft for the next open/settings view.
                });
        };
    }, [contextKey, contextTitle, isOpen, type]);

    useEffect(() => {
        return () => {
            clearRetryTimer();
        };
    }, [clearRetryTimer]);

    const updateContentFromEditor = useCallback(() => {
        const html = normalizeEditorHtml(editorRef.current?.innerHTML || '');
        latestContentRef.current = html;
        setContent(html);
        setHasUnsavedChanges(html !== lastSavedContentRef.current);
        setHasLocalDraft(true);
        writeDraft(type, contextKey, contextTitle, html);
        if (saveError) setSaveError('');
    }, [contextKey, contextTitle, saveError, type]);

    const focusEditor = useCallback(() => {
        editorRef.current?.focus();
    }, []);

    const runCommand = useCallback((command, value = null) => {
        focusEditor();
        document.execCommand(command, false, value);
        updateContentFromEditor();
    }, [focusEditor, updateContentFromEditor]);

    const handleImageInsert = useCallback(() => {
        const url = window.prompt('Enter image URL');
        if (!url) return;
        runCommand('insertImage', url);
    }, [runCommand]);

    const handleManualSave = useCallback(() => {
        saveNote(latestContentRef.current, { showToast: true });
    }, [saveNote]);

    const flushPendingSave = useCallback(async () => {
        if (!hasUnsavedChanges) return true;
        return saveNote(latestContentRef.current);
    }, [hasUnsavedChanges, saveNote]);

    const handleClose = useCallback(async () => {
        await flushPendingSave();
        onClose?.();
    }, [flushPendingSave, onClose]);

    if (!isOpen) return null;

    const desktopPlacement = isPinned
        ? 'items-end justify-end'
        : desktopSide === 'left'
            ? 'md:items-start md:justify-start'
            : 'md:items-start md:justify-end';

    return (
        <AnimatePresence>
            <div className={`fixed inset-0 z-[200] pointer-events-none flex items-end justify-center p-3 sm:p-5 md:p-6 ${desktopPlacement}`}>
                <motion.div
                    initial={{ opacity: 0, y: 32, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 32, scale: 0.96 }}
                    transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                    className={`relative pointer-events-auto shadow-[0_24px_80px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden ${
                        isPinned
                            ? 'w-full max-w-[380px] h-[min(66vh,500px)] rounded-[28px]'
                            : 'w-full max-w-[360px] h-[min(58vh,520px)] rounded-[28px] md:mt-[66px]'
                    }`}
                    style={{ backgroundColor: '#faf8ef' }}
                >
                    <div
                        className="absolute left-0 top-0 bottom-0 w-8 z-10 flex flex-col justify-evenly py-5"
                        style={{
                            background: 'linear-gradient(90deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.02) 40%, transparent 100%)',
                            borderRight: '1px solid rgba(0,0,0,0.05)'
                        }}
                    >
                        {Array.from({ length: isPinned ? 16 : 20 }).map((_, i) => (
                            <div key={i} className="relative w-full h-3">
                                <div className="absolute left-2 top-0 w-3 h-3 rounded-full bg-[#e4e1d5] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.2)]" />
                                <div className="absolute left-0 top-1 w-4 h-1.5 rounded-r-full bg-gradient-to-r from-gray-700 to-gray-500 shadow-sm" />
                            </div>
                        ))}
                    </div>

                    <div className="relative flex h-full flex-col pl-10">
                        <div className="flex justify-between items-center px-5 py-4 pr-6 relative z-20">
                            <h2
                                className="text-xl md:text-[1.2rem] font-black text-gray-800 flex items-center gap-2 tracking-tight truncate max-w-[76%]"
                                style={{ fontFamily: "'Nunito', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
                            >
                                {contextTitle} <Edit3 size={16} className="text-gray-400 shrink-0" />
                            </h2>
                            <div className="flex items-center gap-2 text-gray-500 shrink-0">
                                <button
                                    onClick={() => setIsPinned((prev) => !prev)}
                                    className={`hover:text-gray-800 transition-colors rounded-full p-1.5 hover:bg-black/5 ${isPinned ? 'text-gray-800 bg-black/5' : ''}`}
                                    title="Pin to corner"
                                >
                                    <Pin size={18} className={isPinned ? 'fill-gray-800' : ''} />
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="hover:text-gray-800 transition-colors bg-black/5 hover:bg-black/10 rounded-full p-1.5"
                                    title="Close notes"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-5 py-2.5 border-y border-black/5 relative z-20 bg-white/30 backdrop-blur-sm overflow-x-auto custom-scrollbar">
                            <button onClick={() => runCommand('undo')} className="hover:text-gray-800 p-1.5 rounded hover:bg-black/5 text-gray-500" title="Undo">
                                <Undo size={15} />
                            </button>
                            <button onClick={() => runCommand('redo')} className="hover:text-gray-800 p-1.5 rounded hover:bg-black/5 text-gray-500" title="Redo">
                                <Redo size={15} />
                            </button>
                            <div className="w-px h-4 bg-gray-300 mx-1" />
                            <button onClick={() => runCommand('bold')} className="hover:text-gray-800 p-1.5 rounded hover:bg-black/5 text-gray-500" title="Bold">
                                <Bold size={15} />
                            </button>
                            <button onClick={() => runCommand('italic')} className="hover:text-gray-800 p-1.5 rounded hover:bg-black/5 text-gray-500" title="Italic">
                                <Italic size={15} />
                            </button>
                            <button onClick={() => runCommand('underline')} className="hover:text-gray-800 p-1.5 rounded hover:bg-black/5 text-gray-500" title="Underline">
                                <Underline size={15} />
                            </button>
                            <div className="w-px h-4 bg-gray-300 mx-1" />
                            <button onClick={() => runCommand('insertUnorderedList')} className="hover:text-gray-800 p-1.5 rounded hover:bg-black/5 text-gray-500" title="Bullet List">
                                <List size={15} />
                            </button>
                            <button onClick={() => runCommand('insertOrderedList')} className="hover:text-gray-800 p-1.5 rounded hover:bg-black/5 text-gray-500" title="Numbered List">
                                <ListOrdered size={15} />
                            </button>
                            <div className="w-px h-4 bg-gray-300 mx-1" />
                            <button onClick={() => runCommand('formatBlock', 'pre')} className="hover:text-gray-800 p-1.5 rounded hover:bg-black/5 text-yellow-600" title="Code Block">
                                <Edit3 size={15} />
                            </button>
                            <button onClick={handleImageInsert} className="hover:text-gray-800 p-1.5 rounded hover:bg-black/5 text-gray-500" title="Insert Image">
                                <ImageIcon size={15} />
                            </button>
                        </div>

                        <div className="flex-1 relative overflow-hidden">
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, rgba(0,0,0,0.06) 31px, rgba(0,0,0,0.06) 32px)',
                                    backgroundPosition: '0 0',
                                    backgroundAttachment: 'local'
                                }}
                            />
                            <div className="absolute left-8 top-0 bottom-0 w-px bg-red-400/30 pointer-events-none" />

                            {isLoading ? (
                                <div className="flex h-full items-center justify-center relative z-10">
                                    <Loader2 className="animate-spin text-gray-400" size={32} />
                                </div>
                            ) : (
                                <div className="relative z-10 h-full">
                                    {!hasVisibleContent && (
                                        <div
                                            className="absolute left-12 right-6 top-[7px] text-gray-400/90 pointer-events-none"
                                            style={{
                                                lineHeight: '32px',
                                                fontSize: '16px',
                                                fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', sans-serif"
                                            }}
                                        >
                                            Type your notes here. Formatting, autosave, and manual save all work now.
                                        </div>
                                    )}
                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        suppressContentEditableWarning
                                        spellCheck={false}
                                        onInput={updateContentFromEditor}
                                        onBlur={flushPendingSave}
                                        className="h-full overflow-y-auto overflow-x-hidden outline-none custom-scrollbar px-12 py-[5px] text-gray-800 break-words"
                                        style={{
                                            lineHeight: '32px',
                                            fontSize: '16px',
                                            fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', sans-serif",
                                            letterSpacing: '0.01em',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center gap-3 px-6 py-3 bg-[#faf8ef]/85 backdrop-blur-md border-t border-black/5 relative z-20">
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium min-w-0">
                                {isSaving ? (
                                    <><Loader2 size={12} className="animate-spin" /> Saving...</>
                                ) : saveError ? (
                                    <><X size={12} className="text-red-500" /> {saveError}</>
                                ) : hasLocalDraft && hasUnsavedChanges ? (
                                    <><Edit3 size={12} className="text-amber-500" /> Saved locally. Sync pending</>
                                ) : hasUnsavedChanges ? (
                                    <><Edit3 size={12} className="text-yellow-500" /> Unsaved changes</>
                                ) : (
                                    <><Cloud size={14} className="text-green-500" /> Last saved: {lastSaved ? 'Synced' : 'Not yet saved'}</>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={handleManualSave}
                                    disabled={isSaving || !hasUnsavedChanges}
                                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold bg-black/5 text-gray-700 hover:bg-black/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Save size={13} />
                                    Save now
                                </button>
                                <button className="text-gray-400 hover:text-yellow-500 transition-colors">
                                    <Star size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SpiralNotebookWidget;

