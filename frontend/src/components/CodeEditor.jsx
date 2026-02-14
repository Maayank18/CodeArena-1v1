// // RESPONSIVE UPDATE FOR CODE EDITOR
// import React, { useMemo } from 'react';
// import CodeMirror from '@uiw/react-codemirror';
// import { javascript } from '@codemirror/lang-javascript';
// import { python } from '@codemirror/lang-python';
// import { cpp } from '@codemirror/lang-cpp';
// import { java } from '@codemirror/lang-java';
// import { vscodeDark } from '@uiw/codemirror-theme-vscode';
// import { yCollab } from 'y-codemirror.next';
// import * as Y from 'yjs';

// const CodeEditor = ({ roomId, side, isReadOnly, ydoc, provider, language }) => {
    
//     // FIX 1: MEMOIZE YJS OBJECTS (Kept intact)
//     const { ytext, undoManager } = useMemo(() => {
//         const text = ydoc.getText(`code-${side}`);
//         const manager = new Y.UndoManager(text);
//         return { ytext: text, undoManager: manager };
//     }, [ydoc, side]);

//     const getLanguageExtension = (lang) => {
//         switch (lang) {
//             case 'javascript': return javascript({ jsx: true });
//             case 'python': return python();
//             case 'cpp': return cpp();
//             case 'java': return java();
//             default: return javascript();
//         }
//     };

//     return (
//         // Container fills the parent (which will be controlled by Tabs on mobile)
//         <div className="h-full w-full relative flex flex-col bg-[#1e1e1e]">
//             {isReadOnly && (
//                 <div className="absolute inset-0 z-10 bg-black/40 cursor-not-allowed" />
//             )}

//             <CodeMirror
//                 // ✅ RESPONSIVE UPDATE:
//                 // Mobile: text-xs (12px) | Tablet: text-sm (14px) | Desktop: text-base (16px)
//                 className="flex-1 overflow-hidden text-xs sm:text-sm md:text-base" 
//                 height="100%" 
//                 theme={vscodeDark}
//                 extensions={[
//                     getLanguageExtension(language),
//                     yCollab(ytext, provider?.awareness, { undoManager }) 
//                 ]}
//                 readOnly={isReadOnly}
//                 basicSetup={{
//                     lineNumbers: true,
//                     highlightActiveLineGutter: true,
//                     highlightSpecialChars: true,
//                     history: true,
//                     drawSelection: true,
//                     dropCursor: true,
//                     allowMultipleSelections: true,
//                     indentOnInput: true,
//                     syntaxHighlighting: true,
//                     bracketMatching: true,
//                     closeBrackets: true,
//                     autocompletion: true,
//                     rectangularSelection: true,
//                     crosshairCursor: true,
//                     highlightActiveLine: true,
//                     highlightSelectionMatches: true,
//                     closeBracketsKeymap: true,
//                     defaultKeymap: true,
//                     searchKeymap: true,
//                     historyKeymap: true,
//                     foldKeymap: true,
//                     completionKeymap: true,
//                     lintKeymap: true,
//                 }}
//             />
//         </div>
//     );
// };

// export default CodeEditor;




















// FILE: frontend/src/components/CodeEditor.jsx
// PRODUCTION-OPTIMIZED FOR SCALE
import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { vscodeLight } from '@uiw/codemirror-theme-vscode';
import { yCollab } from 'y-codemirror.next';
import * as Y from 'yjs';
import { Loader2, AlertTriangle, WifiOff } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// ✅ PERFORMANCE: Lazy load language modules
const languageCache = new Map();

const getLanguageExtension = (lang) => {
    if (languageCache.has(lang)) {
        return languageCache.get(lang);
    }
    
    let extension;
    switch (lang) {
        case 'javascript':
            extension = javascript({ jsx: true });
            break;
        case 'python':
            extension = python();
            break;
        case 'cpp':
            extension = cpp();
            break;
        case 'java':
            extension = java();
            break;
        default:
            extension = javascript();
    }
    
    languageCache.set(lang, extension);
    return extension;
};

const CodeEditor = ({ roomId, side, isReadOnly, ydoc, provider, language }) => {
    const { theme } = useTheme();
    const [editorState, setEditorState] = useState('loading'); // loading | ready | error | disconnected
    const [errorMessage, setErrorMessage] = useState('');
    const mountedRef = useRef(true);
    const retryTimeoutRef = useRef(null);

    // ✅ CRITICAL: Memoize Yjs objects (prevent recreation on every render)
    const { ytext, undoManager } = useMemo(() => {
        if (!ydoc) {
            console.error('[EDITOR] No ydoc provided');
            return { ytext: null, undoManager: null };
        }
        
        try {
            const text = ydoc.getText(`code-${side}`);
            const manager = new Y.UndoManager(text);
            return { ytext: text, undoManager: manager };
        } catch (error) {
            console.error('[EDITOR] Yjs initialization error:', error);
            setEditorState('error');
            setErrorMessage('Failed to initialize editor');
            return { ytext: null, undoManager: null };
        }
    }, [ydoc, side]);

    // ✅ CRITICAL: Memoize language extension (prevent recreation)
    const languageExtension = useMemo(() => {
        return getLanguageExtension(language);
    }, [language]);

    // ✅ CRITICAL: Memoize theme
    const editorTheme = useMemo(() => {
        return theme === 'dark' ? vscodeDark : vscodeLight;
    }, [theme]);

    // ✅ CRITICAL: Memoize extensions array (MOST IMPORTANT!)
    const extensions = useMemo(() => {
        if (!ytext || !provider) {
            return [languageExtension];
        }
        
        return [
            languageExtension,
            yCollab(ytext, provider.awareness, { undoManager })
        ];
    }, [languageExtension, ytext, provider, undoManager]);

    // ✅ PERFORMANCE: Optimized basicSetup (disable heavy features for better performance)
    const basicSetup = useMemo(() => ({
        lineNumbers: true,
        highlightActiveLineGutter: true,
        highlightSpecialChars: true,
        history: true,
        drawSelection: true,
        dropCursor: true,
        allowMultipleSelections: false, // ✅ Disabled for performance
        indentOnInput: true,
        syntaxHighlighting: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        rectangularSelection: false, // ✅ Disabled for performance
        crosshairCursor: false, // ✅ Disabled for performance
        highlightActiveLine: !isReadOnly, // ✅ Only when editing
        highlightSelectionMatches: !isReadOnly, // ✅ Only when editing
        closeBracketsKeymap: true,
        defaultKeymap: true,
        searchKeymap: true,
        historyKeymap: true,
        foldKeymap: true,
        completionKeymap: true,
        lintKeymap: false, // ✅ Disabled for performance (no real-time linting)
    }), [isReadOnly]);

    // ✅ MONITORING: Provider connection state
    useEffect(() => {
        if (!provider) {
            setEditorState('error');
            setErrorMessage('No provider connection');
            return;
        }

        const handleStatus = ({ status }) => {
            if (!mountedRef.current) return;
            
            if (status === 'connected') {
                setEditorState('ready');
                setErrorMessage('');
                console.log(`[EDITOR] Connected: ${side}`);
            } else if (status === 'disconnected') {
                setEditorState('disconnected');
                setErrorMessage('Reconnecting...');
                console.warn(`[EDITOR] Disconnected: ${side}`);
            }
        };

        const handleSynced = () => {
            if (!mountedRef.current) return;
            setEditorState('ready');
            console.log(`[EDITOR] Synced: ${side}`);
        };

        provider.on('status', handleStatus);
        provider.on('synced', handleSynced);

        // Initial state check
        if (provider.wsconnected) {
            setEditorState('ready');
        }

        return () => {
            provider.off('status', handleStatus);
            provider.off('synced', handleSynced);
        };
    }, [provider, side]);

    // ✅ CLEANUP: Clear retry timeout on unmount
    useEffect(() => {
        mountedRef.current = true;
        
        return () => {
            mountedRef.current = false;
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []);

    // ✅ ERROR HANDLING: Retry connection
    const handleRetry = useCallback(() => {
        if (provider && !provider.wsconnected) {
            setEditorState('loading');
            provider.connect();
            
            retryTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current && editorState === 'loading') {
                    setEditorState('error');
                    setErrorMessage('Connection timeout');
                }
            }, 10000); // 10 second timeout
        }
    }, [provider, editorState]);

    // ✅ GUARD: Don't render if critical props missing
    if (!ydoc || !ytext) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] p-8">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <p className="text-lg font-bold mb-2">Editor Initialization Failed</p>
                <p className="text-sm text-[var(--text-secondary)]">
                    {errorMessage || 'Missing required configuration'}
                </p>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative flex flex-col bg-[var(--bg-primary)]">
            
            {/* ✅ READ-ONLY OVERLAY */}
            {isReadOnly && (
                <div className="absolute inset-0 z-10 bg-black/30 cursor-not-allowed backdrop-blur-[0.5px]" />
            )}

            {/* ✅ LOADING STATE */}
            {editorState === 'loading' && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--bg-primary)]/90">
                    <Loader2 className="animate-spin text-accent mb-3" size={32} />
                    <p className="text-sm text-[var(--text-secondary)] font-medium">
                        Connecting to collaboration server...
                    </p>
                </div>
            )}

            {/* ✅ DISCONNECTED STATE */}
            {editorState === 'disconnected' && (
                <div className="absolute top-0 left-0 right-0 z-20 bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                        <WifiOff size={16} />
                        <span className="font-medium">Reconnecting...</span>
                    </div>
                </div>
            )}

            {/* ✅ ERROR STATE */}
            {editorState === 'error' && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--bg-primary)]/95 p-8">
                    <AlertTriangle size={48} className="text-red-500 mb-4" />
                    <p className="text-lg font-bold text-[var(--text-primary)] mb-2">Connection Error</p>
                    <p className="text-sm text-[var(--text-secondary)] mb-6 text-center max-w-md">
                        {errorMessage || 'Unable to connect to collaboration server'}
                    </p>
                    <button
                        onClick={handleRetry}
                        className="px-6 py-2 bg-accent text-black font-bold rounded-lg hover:bg-emerald-400 transition-all"
                    >
                        Retry Connection
                    </button>
                </div>
            )}

            {/* ✅ CODE EDITOR */}
            <CodeMirror
                className="flex-1 overflow-hidden text-xs sm:text-sm md:text-base transition-opacity duration-200"
                style={{ opacity: editorState === 'ready' ? 1 : 0.5 }}
                height="100%" 
                theme={editorTheme}
                extensions={extensions}
                readOnly={isReadOnly || editorState !== 'ready'}
                basicSetup={basicSetup}
                editable={!isReadOnly && editorState === 'ready'}
            />
        </div>
    );
};

// ✅ PERFORMANCE: Memoize entire component
export default React.memo(CodeEditor, (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
        prevProps.roomId === nextProps.roomId &&
        prevProps.side === nextProps.side &&
        prevProps.isReadOnly === nextProps.isReadOnly &&
        prevProps.language === nextProps.language &&
        prevProps.ydoc === nextProps.ydoc &&
        prevProps.provider === nextProps.provider
    );
});