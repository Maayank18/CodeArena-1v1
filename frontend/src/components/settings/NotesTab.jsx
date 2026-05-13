import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, Loader2, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api.js';

const LOCAL_NOTE_PREFIX = 'codearena_note_draft:';

const getNotePreview = (content = '') => {
    if (typeof window === 'undefined' || !content) return '';

    const doc = new DOMParser().parseFromString(content, 'text/html');
    return doc.body.textContent?.replace(/\s+/g, ' ').trim() || '';
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

    useEffect(() => {
        let isMounted = true;
        const fetchNotes = async () => {
            try {
                const { data } = await api.get('/notes');
                const localDrafts = getLocalDraftNotes();
                if (isMounted && data.success) {
                    const remoteNotes = data.notes || [];
                    const remoteKeys = new Set(remoteNotes.map((note) => `${note.type}:${note.contextTitle}`));
                    setNotes([
                        ...localDrafts.filter((draft) => !remoteKeys.has(`${draft.type}:${draft.contextTitle}`)),
                        ...remoteNotes
                    ]);
                }
            } catch (error) {
                console.error("Failed to fetch notes:", error);
                if (isMounted) {
                    setNotes(getLocalDraftNotes());
                }
                toast.error("Unable to load notes");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchNotes();
        return () => { isMounted = false; };
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;
        
        try {
            const { data } = await api.delete(`/notes/${id}`);
            if (data.success) {
                setNotes(prev => prev.filter(n => n._id !== id));
                toast.success("Note deleted");
            }
        } catch (error) {
            console.error("Failed to delete note:", error);
            toast.error("Failed to delete note");
        }
    };

    const filteredNotes = notes.filter(n => 
        n.contextTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
        getNotePreview(n.content).toLowerCase().includes(searchQuery.toLowerCase())
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
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen size={20} className="text-emerald-400" />
                    My Notes
                </h3>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors w-64"
                    />
                </div>
            </div>

            {notes.length === 0 ? (
                <div className="rounded-2xl border border-gray-800 bg-[#1a1a1a] p-12 text-center">
                    <BookOpen size={48} className="mx-auto mb-4 text-gray-700" />
                    <h4 className="text-base font-bold text-white">No notes yet</h4>
                    <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
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
                            className="group rounded-2xl border border-gray-800 bg-[#1a1a1a] p-5 hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-black/20 flex flex-col h-48"
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
                                    <h4 className="font-bold text-white mt-2 text-base truncate pr-2">
                                        {note.contextTitle}
                                    </h4>
                                </div>
                                <button 
                                    onClick={() => handleDelete(note._id)}
                                    className="p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed whitespace-pre-wrap font-mono">
                                    {getNotePreview(note.content) || <span className="italic text-gray-600">Empty note...</span>}
                                </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-center text-xs text-gray-500">
                                <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1 hover:text-emerald-400 cursor-pointer transition-colors">
                                    View in editor <ExternalLink size={12} />
                                </span>
                            </div>
                        </motion.div>
                    ))}
                    {filteredNotes.length === 0 && notes.length > 0 && (
                        <div className="col-span-full py-8 text-center text-gray-500">
                            No notes match your search.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotesTab;
