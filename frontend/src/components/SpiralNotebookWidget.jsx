import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Pin, Undo, Redo, Bold, Italic, Underline, 
    List, ListOrdered, Image as ImageIcon, MoreHorizontal,
    Star, CloudCheck, Loader2, Edit3
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
    const debouncedContent = useDebounce(content, 1500);

    const isInitialMount = useRef(true);
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
                } else if (isMounted) {
                    setContent('');
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
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (!isOpen) return;

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
                }
            } catch (error) {
                console.error("Failed to save note:", error);
                toast.error("Autosave failed");
            } finally {
                setIsSaving(false);
            }
        };

        if (debouncedContent !== undefined) {
            saveNote();
        }
    }, [debouncedContent, isOpen, type, contextTitle]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`fixed z-[200] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] 
                    flex flex-col
                    md:bottom-8 md:right-8 bottom-0 right-0
                    md:w-[500px] w-full md:h-[650px] h-[85vh]
                    md:rounded-2xl rounded-t-2xl
                    overflow-hidden
                    ${isPinned ? 'md:bottom-8 md:right-8' : ''}
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
                    {Array.from({ length: 24 }).map((_, i) => (
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
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 font-sans tracking-tight"
                            style={{ fontFamily: "'Nunito', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
                            {contextTitle} <Edit3 size={16} className="text-gray-400" />
                        </h2>
                        <div className="flex items-center gap-3 text-gray-500">
                            <button onClick={() => setIsPinned(!isPinned)} className={`hover:text-gray-800 transition-colors ${isPinned ? 'text-gray-800' : ''}`}>
                                <Pin size={18} className={isPinned ? "fill-gray-800" : ""} />
                            </button>
                            <button onClick={onClose} className="hover:text-gray-800 transition-colors bg-black/5 hover:bg-black/10 rounded-full p-1">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Toolbar (Aesthetic/Functional Mock) */}
                    <div className="flex items-center gap-4 px-6 py-2 border-y border-black/5 relative z-20 bg-white/30 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                            <button className="hover:text-gray-700 p-1 rounded hover:bg-black/5"><Undo size={16} /></button>
                            <button className="hover:text-gray-700 p-1 rounded hover:bg-black/5"><Redo size={16} /></button>
                        </div>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <button className="hover:text-gray-700 p-1 rounded hover:bg-black/5"><Bold size={16} /></button>
                            <button className="hover:text-gray-700 p-1 rounded hover:bg-black/5"><Italic size={16} /></button>
                            <button className="hover:text-gray-700 p-1 rounded hover:bg-black/5"><Underline size={16} /></button>
                        </div>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <button className="hover:text-gray-700 p-1 rounded hover:bg-black/5"><List size={16} /></button>
                            <button className="hover:text-gray-700 p-1 rounded hover:bg-black/5"><ListOrdered size={16} /></button>
                        </div>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <button className="hover:text-gray-700 p-1 rounded hover:bg-black/5"><Edit3 size={16} className="text-yellow-500" /></button>
                            <button className="hover:text-gray-700 p-1 rounded hover:bg-black/5"><ImageIcon size={16} /></button>
                            <button className="hover:text-gray-700 p-1 rounded hover:bg-black/5"><MoreHorizontal size={16} /></button>
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
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Type your notes here..."
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
                            ) : (
                                <><CloudCheck size={14} className="text-green-500" /> 
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
