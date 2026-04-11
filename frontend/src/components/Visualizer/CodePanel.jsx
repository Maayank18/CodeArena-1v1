// src/components/Visualizer/CodePanel.jsx
import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

const CodePanel = ({ code, setCode, activeLine }) => {
    const editorRef = useRef(null);
    const decorationsRef = useRef([]);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        
        // Define custom CSS class for line highlighting
        monaco.editor.defineTheme('codearena-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#0d1117',
                'editor.lineHighlightBackground': '#1f6feb22',
                'editorLineNumber.foreground': '#6e7681',
                'editorLineNumber.activeForeground': '#58a6ff',
            }
        });
        
        monaco.editor.setTheme('codearena-dark');
    };

    // Highlight active execution line
    useEffect(() => {
        if (!editorRef.current || !activeLine) {
            return;
        }

        const editor = editorRef.current;
        
        // Remove old decorations
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);

        // Add new highlight for active line
        decorationsRef.current = editor.deltaDecorations([], [
            {
                range: new window.monaco.Range(activeLine, 1, activeLine, 1),
                options: {
                    isWholeLine: true,
                    className: 'active-line-highlight',
                    glyphMarginClassName: 'active-line-glyph',
                    linesDecorationsClassName: 'active-line-decoration'
                }
            }
        ]);
        
        // Smooth scroll to active line
        editor.revealLineInCenter(activeLine, 1); // 1 = smooth scroll

    }, [activeLine]);

    return (
        <div className="h-full relative">
            <Editor
                height="100%"
                defaultLanguage="javascript"
                value={code}
                onChange={(val) => setCode(val || '')}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "'Fira Code', 'Monaco', 'Courier New', monospace",
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    readOnly: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                    padding: { top: 16, bottom: 16 },
                    lineDecorationsWidth: 8,
                    lineNumbersMinChars: 3,
                    glyphMargin: true,
                    folding: true,
                    bracketPairColorization: {
                        enabled: true
                    },
                    suggest: {
                        showWords: false // Disable autocomplete for cleaner experience
                    }
                }}
            />
            
            {/* Custom CSS for active line highlight */}
            <style jsx global>{`
                .active-line-highlight {
                    background: rgba(88, 166, 255, 0.15) !important;
                    border-left: 3px solid #58a6ff !important;
                }
                
                .active-line-glyph {
                    background: #58a6ff !important;
                    width: 4px !important;
                    margin-left: 2px !important;
                }
                
                .active-line-decoration::before {
                    content: '▶';
                    color: #58a6ff;
                    font-size: 10px;
                    position: absolute;
                    left: -12px;
                }
            `}</style>
        </div>
    );
};

export default CodePanel;
// V 1.5
