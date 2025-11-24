// updated redenr issue due to parent 
import React, { useMemo } from 'react'; // <--- Added useMemo
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { yCollab } from 'y-codemirror.next';
import * as Y from 'yjs';

const CodeEditor = ({ roomId, side, isReadOnly, ydoc, provider, language }) => {
    
    // FIX 1: MEMOIZE YJS OBJECTS
    // This prevents the editor from crashing/resetting every time the Timer ticks
    const { ytext, undoManager } = useMemo(() => {
        const text = ydoc.getText(`code-${side}`);
        const manager = new Y.UndoManager(text);
        return { ytext: text, undoManager: manager };
    }, [ydoc, side]); // Only recreate if the document or side changes (rare)

    const getLanguageExtension = (lang) => {
        switch (lang) {
            case 'javascript': return javascript({ jsx: true });
            case 'python': return python();
            case 'cpp': return cpp();
            case 'java': return java();
            default: return javascript();
        }
    };

    return (
        <div className="h-full w-full relative flex flex-col bg-[#1e1e1e]">
            {isReadOnly && (
                // This overlay prevents typing in the other person's box
                <div className="absolute inset-0 z-10 bg-black/40 cursor-not-allowed" />
            )}

            <CodeMirror
                className="flex-1 overflow-hidden text-base" 
                height="100%" 
                theme={vscodeDark}
                extensions={[
                    getLanguageExtension(language),
                    // provider.awareness must be passed safely
                    yCollab(ytext, provider?.awareness, { undoManager }) 
                ]}
                readOnly={isReadOnly}
                basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    highlightSpecialChars: true,
                    history: true,
                    drawSelection: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    syntaxHighlighting: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    crosshairCursor: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    closeBracketsKeymap: true,
                    defaultKeymap: true,
                    searchKeymap: true,
                    historyKeymap: true,
                    foldKeymap: true,
                    completionKeymap: true,
                    lintKeymap: true,
                }}
            />
        </div>
    );
};

export default CodeEditor;


