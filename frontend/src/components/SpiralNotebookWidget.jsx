import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Pin, Undo, Redo, Bold, Italic, Underline, 
    List, ListOrdered, Image as ImageIcon, MoreHorizontal,
    Star, CloudSelect, Loader2, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api.js';

// Custom hook for debouncing
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

const SpiralNotebookWidget = ({ isOpen, onClose, type, contextTitle }) => {
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [isPinned, setIsPinned] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // Add a flag to track if changes were made by the user, not just initial load
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    const debouncedContent = useDebounce(content, 1500);
    const textareaRef = useRef(null);

    // Fetch existing note on mount
    useEffect(() => {
        if (!isOpen) return;
        let isMounted = true;

        const fetchNote = async () => {
            setIsLoading(true);
            try {
                const { data } = await api.get('/notes/context', {
                    params: { type, contextTitle }
                });
                if (isMounted && data.success && data.note) {
                    setContent(data.note.content || '');
                    setLastSaved(new Date());
                    setHasUnsavedChanges(false);
                } else if (isMounted) {
                    setContent('');
                    setHasUnsavedChanges(false);
                }
            } catch (error) {
                if (error.response?.status !== 404) {
                    console.error("Failed to load note:", error);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchNote();

        return () => { isMounted = false; };
    }, [isOpen, type, contextTitle]);

    // Autosave functionality
    useEffect(() => {
        if (!isOpen || !hasUnsavedChanges) return;

        const saveNote = async () => {
            setIsSaving(true);
            try {
                const { data } = await api.post('/notes', {
                    type,
                    contextTitle,
                    content: debouncedContent
                });
                if (data.success) {
                    setLastSaved(new Date());
                    setHasUnsavedChanges(false);
                }
            } catch (error) {
                console.error("Failed to save note:", error);
                const errorMsg = error.response?.data?.message || "Please check your network.";
                toast.error(`Autosave failed: ${errorMsg}`);
            } finally {
                setIsSaving(false);
            }
        };

        if (debouncedContent !== undefined) {
            saveNote();
        }
    }, [debouncedContent, isOpen, type, contextTitle, hasUnsavedChanges]);

    const handleContentChange = (e) => {
        setContent(e.target.value);
        setHasUnsavedChanges(true);
    };

    // Helper for inserting markdown text
    const insertMarkdown = (prefix, suffix = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const replacement = prefix + selectedText + suffix;

        const newContent = content.substring(0, start) + replacement + content.substring(end);
        setContent(newContent);
        setHasUnsavedChanges(true);

        // Reset cursor position after React re-renders
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`fixed z-[200] shadow-[0_24px_80px_rgba(0,0,0,0.6)] 
                    flex flex-col
                    w-full h-[85vh]
                    rounded-t-2xl md:rounded-2xl
                    overflow-hidden
                    ${isPinned 
                        ? 'md:w-[400px] md:h-[500px] md:bottom-6 md:right-6 md:top-auto md:left-auto md:translate-x-0 md:translate-y-0' 
                        : 'md:w-[460px] md:h-[580px] md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bottom-0 right-0'}
                `}
                style={{
                    backgroundColor: '#faf8ef', // Creamy notebook color
                }}
            >
                {/* Spiral Binding Edge (Left side) */}
                <div className="absolute left-0 top-0 bottom-0 w-8 z-10 flex flex-col justify-evenly py-4"
                     style={{
                         background: 'linear-gradient(90deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.02) 40%, transparent 100%)',
                         borderRight: '1px solid rgba(0,0,0,0.05)'
                     }}>
                    {Array.from({ length: isPinned ? 18 : 22 }).map((_, i) => (
                        <div key={i} className="relative w-full h-3">
                            {/* Hole */}
                            <div className="absolute left-2 top-0 w-3 h-3 rounded-full bg-[#e4e1d5] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.2)]" />
                            {/* Ring */}
                            <div className="absolute left-0 top-1 w-4 h-1.5 rounded-r-full bg-gradient-to-r from-gray-700 to-gray-500 shadow-sm" />
                        </div>
                    ))}
                </div>

                {/* Main Content Area (offset by spiral width) */}
                <div className="flex-1 flex flex-col pl-10 relative">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 pr-5 relative z-20">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 font-sans tracking-tight truncate max-w-[80%]"
                            style={{ fontFamily: "'Nunito', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
                            {contextTitle} <Edit3 size={16} className="text-gray-400 shrink-0" />
                        </h2>
                        <div className="flex items-center gap-3 text-gray-500 shrink-0">
                            <button onClick={() => setIsPinned(!isPinned)} className={`hover:text-gray-800 transition-colors ${isPinned ? 'text-gray-800' : ''}`} title="Pin to corner">
                                <Pin size={18} className={isPinned ? "fill-gray-800" : ""} />
                            </button>
                            <button onClick={onClose} className="hover:text-gray-800 transition-colors bg-black/5 hover:bg-black/10 rounded-full p-1" title="Close notes">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Toolbar (Functional Markdown Insertion) */}
                    <div className="flex items-center gap-3 px-5 py-2 border-y border-black/5 relative z-20 bg-white/30 backdrop-blur-sm overflow-x-auto custom-scrollbar">
                        <div className="flex items-center gap-1 text-gray-500">
                            <button onClick={() => insertMarkdown('**', '**')} className="hover:text-gray-800 p-1.5 rounded hover:bg-black/5" title="Bold"><Bold size={15} /></button>
                            <button onClick={() => insertMarkdown('*', '*')} className="hover:text-gray-800 p-1.5 rounded hover:bg-black/5" title="Italic"><Italic size={15} /></button>
                            <button onClick={() => insertMarkdown('__', '__')} className="hover:text-gray-800 p-1.5 rounded hover:bg-black/5" title="Underline"><Underline size={15} /></button>
                        </div>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <div className="flex items-center gap-1 text-gray-500">
                            <button onClick={() => insertMarkdown('- ')} className="hover:text-gray-800 p-1.5 rounded hover:bg-black/5" title="Bullet List"><List size={15} /></button>
                            <button onClick={() => insertMarkdown('1. ')} className="hover:text-gray-800 p-1.5 rounded hover:bg-black/5" title="Numbered List"><ListOrdered size={15} /></button>
                        </div>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <div className="flex items-center gap-1 text-gray-500">
                            <button onClick={() => insertMarkdown('`', '`')} className="hover:text-gray-800 p-1.5 rounded hover:bg-black/5" title="Inline Code"><Edit3 size={15} className="text-yellow-600" /></button>
                            <button onClick={() => insertMarkdown('![alt text](url)')} className="hover:text-gray-800 p-1.5 rounded hover:bg-black/5" title="Image"><ImageIcon size={15} /></button>
                        </div>
                    </div>

                    {/* Lined Paper & Textarea Container */}
                    <div className="flex-1 relative overflow-hidden flex flex-col">
                        {/* Lined Background Pattern */}
                        <div className="absolute inset-0 pointer-events-none" 
                             style={{
                                 backgroundImage: `repeating-linear-gradient(transparent, transparent 31px, rgba(0,0,0,0.06) 31px, rgba(0,0,0,0.06) 32px)`,
                                 backgroundPosition: '0 0px',
                                 backgroundAttachment: 'local'
                             }}
                        />
                        
                        {/* Vertical Margin Line */}
                        <div className="absolute left-8 top-0 bottom-0 w-px bg-red-400/30 pointer-events-none" />

                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center z-10">
                                <Loader2 className="animate-spin text-gray-400" size={32} />
                            </div>
                        ) : (
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={handleContentChange}
                                placeholder="Type your notes here... Use the toolbar above for markdown formatting."
                                spellCheck="false"
                                className="flex-1 w-full bg-transparent resize-none outline-none z-10 px-12 py-[5px] text-gray-800 custom-scrollbar"
                                style={{
                                    lineHeight: '32px',
                                    fontSize: '16px',
                                    fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', sans-serif",
                                    letterSpacing: '0.01em'
                                }}
                            />
                        )}
                    </div>

                    {/* Footer / Status */}
                    <div className="flex justify-between items-center px-6 py-3 bg-[#faf8ef]/80 backdrop-blur-md border-t border-black/5 relative z-20">
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            {isSaving ? (
                                <><Loader2 size={12} className="animate-spin" /> Saving...</>
                            ) : hasUnsavedChanges ? (
                                <><Edit3 size={12} className="text-yellow-500" /> Unsaved changes</>
                            ) : (
                                <><CloudSelect size={14} className="text-green-500" /> 
                                  Last saved: {lastSaved ? "just now" : "Synced"}
                                </>
                            )}
                        </div>
                        <button className="text-gray-400 hover:text-yellow-500 transition-colors">
                            <Star size={18} />
                        </button>
                    </div>

                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SpiralNotebookWidget;
