import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

const CodePanel = ({ code, setCode, activeLine, theme = 'dark' }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const applyEditorTheme = (activeTheme) => {
    if (!monacoRef.current) {
      return;
    }

    monacoRef.current.editor.setTheme(activeTheme === 'dark' ? 'codearena-dark' : 'codearena-soft-light');
  };

  const handleEditorBeforeMount = (monaco) => {
    monaco.editor.defineTheme('codearena-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0d1117',
        'editor.lineHighlightBackground': '#1f6feb22',
        'editorLineNumber.foreground': '#6e7681',
        'editorLineNumber.activeForeground': '#58a6ff',
      },
    });

    monaco.editor.defineTheme('codearena-soft-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#fffdf8',
        'editor.lineHighlightBackground': '#ebe7de',
        'editorLineNumber.foreground': '#94a3b8',
        'editorLineNumber.activeForeground': '#2563eb',
        'editor.selectionBackground': '#dbeafe',
        'editor.inactiveSelectionBackground': '#e2e8f0',
      },
    });
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    applyEditorTheme(theme);
  };

  useEffect(() => {
    applyEditorTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!editorRef.current || !activeLine || !monacoRef.current) {
      return;
    }

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    decorationsRef.current = editor.deltaDecorations([], [
      {
        range: new monaco.Range(activeLine, 1, activeLine, 1),
        options: {
          isWholeLine: true,
          className: theme === 'dark' ? 'active-line-highlight' : 'active-line-highlight-light',
          glyphMarginClassName: theme === 'dark' ? 'active-line-glyph' : 'active-line-glyph-light',
          linesDecorationsClassName: theme === 'dark' ? 'active-line-decoration' : 'active-line-decoration-light',
        },
      },
    ]);

    editor.revealLineInCenter(activeLine, 1);
  }, [activeLine, theme]);

  return (
    <div className="h-full relative">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={code}
        onChange={(val) => setCode(val || '')}
        onMount={handleEditorDidMount}
        beforeMount={handleEditorBeforeMount}
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
          bracketPairColorization: { enabled: true },
          suggest: { showWords: false },
        }}
      />

      <style>{`
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

        .active-line-highlight-light {
          background: rgba(37, 99, 235, 0.1) !important;
          border-left: 3px solid #2563eb !important;
        }

        .active-line-glyph-light {
          background: #2563eb !important;
          width: 4px !important;
          margin-left: 2px !important;
        }

        .active-line-decoration-light::before {
          content: '▶';
          color: #2563eb;
          font-size: 10px;
          position: absolute;
          left: -12px;
        }
      `}</style>
    </div>
  );
};

export default CodePanel;
