import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, Loader2, Trash2, ExternalLink, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api.js';

const LOCAL_NOTE_PREFIX = 'codearena_note_draft:';

const htmlToPlainText = (content = '', { collapseWhitespace = false } = {}) => {
    if (typeof window === 'undefined' || !content) return '';

    const withBlockBreaks = content
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li|ul|ol|pre|blockquote|h[1-6])>/gi, '\n')
        .replace(/<li[^>]*>/gi, '- ');

    const doc = new DOMParser().parseFromString(withBlockBreaks, 'text/html');
    const text = doc.body.textContent || '';

    return collapseWhitespace
        ? text.replace(/\s+/g, ' ').trim()
        : text.replace(/\n{3,}/g, '\n\n').trim();
};

const getLocalDraftNotes = () => {
    if (typeof window === 'undefined') return [];

    const drafts = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (!key?.startsWith(LOCAL_NOTE_PREFIX)) continue;

        try {
            const raw = window.localStorage.getItem(key);
            const draft = raw ? JSON.parse(raw) : null;
            if (!draft?.type || !draft?.contextTitle) continue;

            drafts.push({
                _id: `local:${key}`,
                type: draft.type,
                contextKey: draft.contextKey || '',
                contextTitle: draft.contextTitle,
                content: draft.content || '',
                updatedAt: draft.updatedAt || Date.now(),
                isLocalDraft: true
            });
        } catch {
            // Ignore malformed local draft entries
        }
    }

    return drafts;
};

const NotesTab = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNote, setSelectedNote] = useState(null);
    const [loadWarning, setLoadWarning] = useState('');

    useEffect(() => {
        let isMounted = true;
        const fetchNotes = async () => {
            const localDrafts = getLocalDraftNotes();
            try {
                const { data } = await api.get('/notes');
                if (isMounted && data.success) {
                    const remoteNotes = data.notes || [];
                    const noteMap = new Map();

                    for (const note of remoteNotes) {
                        noteMap.set(`${note.type}:${note.contextKey || note.contextTitle}`, note);
                    }

                    for (const draft of localDrafts) {
                        const key = `${draft.type}:${draft.contextKey || draft.contextTitle}`;
                        const existing = noteMap.get(key);
                        const existingUpdatedAt = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
                        const draftUpdatedAt = draft.updatedAt || 0;

                        if (!existing || draftUpdatedAt >= existingUpdatedAt) {
                            noteMap.set(key, draft);
                        }
                    }

                    setNotes(
                        Array.from(noteMap.values()).sort(
                            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                        )
                    );
                    setLoadWarning('');
                }
            } catch (error) {
                console.error("Failed to fetch notes:", error);
                if (isMounted) {
                    setNotes(localDrafts);
                    setLoadWarning(
                        localDrafts.length > 0
                            ? 'Cloud notes could not be reached, so you are seeing locally saved drafts.'
                            : ''
                    );
                }
                if (localDrafts.length === 0) {
                    toast.error("Unable to load notes");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchNotes();
        return () => { isMounted = false; };
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;

        if (id.startsWith('local:')) {
            const storageKey = id.slice('local:'.length);
            window.localStorage.removeItem(storageKey);
            setNotes(prev => prev.filter(n => n._id !== id));
            if (selectedNote?._id === id) {
                setSelectedNote(null);
            }
            toast.success("Local draft deleted");
            return;
        }
        
        try {
            const { data } = await api.delete(`/notes/${id}`);
            if (data.success) {
                setNotes(prev => prev.filter(n => n._id !== id));
                if (selectedNote?._id === id) {
                    setSelectedNote(null);
                }
                toast.success("Note deleted");
            }
        } catch (error) {
            console.error("Failed to delete note:", error);
            toast.error("Failed to delete note");
        }
    };

    const filteredNotes = notes.filter(n => 
        n.contextTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
        htmlToPlainText(n.content, { collapseWhitespace: true }).toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-emerald-400" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <BookOpen size={20} className="text-emerald-400" />
                    My Notes
                </h3>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors w-64"
                    />
                </div>
            </div>

            {loadWarning && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                    {loadWarning}
                </div>
            )}

            {notes.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-12 text-center">
                    <BookOpen size={48} className="mx-auto mb-4 text-[var(--text-secondary)]" />
                    <h4 className="text-base font-bold text-[var(--text-primary)]">No notes yet</h4>
                    <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                        Your spiral notebook is empty! Open a problem in the Battle Arena or Campaign Mode and click "Add Notes" to start writing.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredNotes.map((note) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={note._id}
                            className="group rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 hover:border-[var(--border-color)] transition-all hover:shadow-lg hover:shadow-black/20 flex flex-col h-48"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                                        note.type === 'battle_arena' 
                                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                    }`}>
                                        {note.type === 'battle_arena' ? 'Battle Arena' : 'Campaign Mode'}
                                    </span>
                                    {note.isLocalDraft && (
                                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-amber-500/20 bg-amber-500/10 text-amber-400">
                                            Local draft
                                        </span>
                                    )}
                                    <h4 className="font-bold text-[var(--text-primary)] mt-2 text-base truncate pr-2">
                                        {note.contextTitle}
                                    </h4>
                                </div>
                                <button 
                                    onClick={() => handleDelete(note._id)}
                                    className="p-1.5 text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed whitespace-pre-wrap font-mono">
                                    {htmlToPlainText(note.content, { collapseWhitespace: true }) || <span className="italic text-[var(--text-secondary)]">Empty note...</span>}
                                </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex justify-between items-center text-xs text-[var(--text-secondary)]">
                                <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedNote(note)}
                                    className="flex items-center gap-1 hover:text-emerald-400 cursor-pointer transition-colors"
                                >
                                    Open note <ExternalLink size={12} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                    {filteredNotes.length === 0 && notes.length > 0 && (
                        <div className="col-span-full py-8 text-center text-[var(--text-secondary)]">
                            No notes match your search.
                        </div>
                    )}
                </div>
            )}

            {selectedNote && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                    <button
                        type="button"
                        onClick={() => setSelectedNote(null)}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-color)] px-5 py-4">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                                        selectedNote.type === 'battle_arena'
                                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                    }`}>
                                        {selectedNote.type === 'battle_arena' ? 'Battle Arena' : 'Campaign Mode'}
                                    </span>
                                    {selectedNote.isLocalDraft && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-amber-500/20 bg-amber-500/10 text-amber-400">
                                            Local draft
                                        </span>
                                    )}
                                </div>
                                <h4 className="mt-3 text-lg font-bold text-[var(--text-primary)]">{selectedNote.contextTitle}</h4>
                                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                    Updated {new Date(selectedNote.updatedAt).toLocaleString()}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedNote(null)}
                                className="rounded-full border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-2 text-[var(--text-secondary)] transition-colors hover:border-[var(--border-color)] hover:text-[var(--text-primary)]"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="overflow-y-auto px-5 py-5 custom-scrollbar">
                            <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-[var(--text-primary)] font-mono">
                                {htmlToPlainText(selectedNote.content) || 'Empty note...'}
                            </pre>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default NotesTab;
