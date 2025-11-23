// import React from 'react';
// import CodeMirror from '@uiw/react-codemirror';
// import { javascript } from '@codemirror/lang-javascript';
// import { python } from '@codemirror/lang-python';
// import { cpp } from '@codemirror/lang-cpp'; // Ensure you installed this
// import { vscodeDark } from '@uiw/codemirror-theme-vscode';
// import { yCollab } from 'y-codemirror.next';
// import * as Y from 'yjs';

// const CodeEditor = ({ roomId, side, isReadOnly, ydoc, provider, language }) => {
    
//     const ytext = ydoc.getText(`code-${side}`);
//     const undoManager = new Y.UndoManager(ytext);

//     // Dynamic Language Extension
//     const getLanguageExtension = (lang) => {
//         switch (lang) {
//             case 'javascript': return javascript({ jsx: true });
//             case 'python': return python();
//             case 'cpp': return cpp();
//             case 'java': return cpp(); // CodeMirror uses cpp package for Java syntax usually, or install lang-java
//             default: return javascript();
//         }
//     };

//     return (
//         <div className="h-full w-full overflow-hidden text-base relative">
//             {/* Read-Only Overlay */}
//             {isReadOnly && (
//                 <div className="absolute inset-0 z-10 bg-black/10 cursor-not-allowed" />
//             )}

//             <CodeMirror
//                 height="100%"
//                 theme={vscodeDark}
//                 extensions={[
//                     getLanguageExtension(language), // <--- DYNAMIC LANGUAGE HERE
//                     yCollab(ytext, provider.awareness, { undoManager }) 
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






// import React from 'react';
// import CodeMirror from '@uiw/react-codemirror';
// import { javascript } from '@codemirror/lang-javascript';
// import { python } from '@codemirror/lang-python';
// import { cpp } from '@codemirror/lang-cpp';
// import { vscodeDark } from '@uiw/codemirror-theme-vscode';
// import { yCollab } from 'y-codemirror.next';
// import * as Y from 'yjs';

// const CodeEditor = ({ roomId, side, isReadOnly, ydoc, provider, language }) => {
    
//     const ytext = ydoc.getText(`code-${side}`);
//     const undoManager = new Y.UndoManager(ytext);

//     const getLanguageExtension = (lang) => {
//         switch (lang) {
//             case 'javascript': return javascript({ jsx: true });
//             case 'python': return python();
//             case 'cpp': return cpp();
//             default: return javascript();
//         }
//     };

//     return (
//         // FIX: 'flex flex-col' allows the inner CodeMirror to fill height properly
//         <div className="h-full w-full relative flex flex-col bg-[#1e1e1e]">
//             {isReadOnly && (
//                 // This overlay prevents typing in the other person's box
//                 <div className="absolute inset-0 z-10 bg-black/10 cursor-not-allowed" />
//             )}

//             <CodeMirror
//                 className="flex-1 overflow-hidden text-base" 
//                 height="100%" 
//                 theme={vscodeDark}
//                 extensions={[
//                     getLanguageExtension(language),
//                     yCollab(ytext, provider.awareness, { undoManager }) 
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
    
//     const { ytext, undoManager } = useMemo(() => {
//         console.log(`🔧 CodeEditor: Creating Yjs text for side: ${side}`);
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

//     // ✅ Add safety check for provider
//     if (!provider || !provider.awareness) {
//         console.warn('⚠️ Provider or awareness not ready yet');
//         return (
//             <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e] text-gray-500">
//                 Initializing editor...
//             </div>
//         );
//     }

//     return (
//         <div className="h-full w-full relative flex flex-col bg-[#1e1e1e]">
//             {isReadOnly && (
//                 <div className="absolute inset-0 z-10 bg-black/40 cursor-not-allowed" />
//             )}

//             <CodeMirror
//                 className="flex-1 overflow-hidden text-base" 
//                 height="100%" 
//                 theme={vscodeDark}
//                 extensions={[
//                     getLanguageExtension(language),
//                     yCollab(ytext, provider.awareness, { undoManager }) 
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