import React, { useEffect, useRef, useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { useTheme } from '../context/ThemeContext.jsx';

const CodeEditor = ({ roomId: _roomId, side, isReadOnly, ydoc, provider, language }) => {
  const { theme } = useTheme();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const MONACO_LANG_MAP = {
    'javascript': 'javascript',
    'python': 'python',
    'cpp': 'cpp',
    'java': 'java',
  };

  const monacoLang = MONACO_LANG_MAP[language] || 'javascript';

  const handleEditorWillMount = (monaco) => {
    // Define custom themes if needed
    monaco.editor.defineTheme('ca-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.lineHighlightBackground': '#2d2d2d',
      },
    });
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);
    console.log(`[ARENA-EDITOR] Editor mounted for ${side} side`);
  };

  useEffect(() => {
    let binding = null;

    const setupBinding = () => {
      // ✅ Phase 1 Fix: Strict guard for getModel race condition
      if (!isEditorReady || !editorRef.current || typeof editorRef.current.getModel !== 'function') {
        return;
      }

      if (!ydoc || !provider) return;

      try {
        const ytext = ydoc.getText(`code-${side}`);
        const model = editorRef.current.getModel();

        if (!model) {
          console.warn("[ARENA-EDITOR] Model not available yet, skipping binding");
          return;
        }

        // Initialize MonacoBinding
        binding = new MonacoBinding(
          ytext,
          model,
          new Set([editorRef.current]),
          provider.awareness
        );

        console.log(`[ARENA-EDITOR] Yjs-Monaco Binding successful for ${side}`);
      } catch (error) {
        console.error("[ARENA-EDITOR] Failed to setup Monaco-Yjs binding:", error);
      }
    };

    setupBinding();

    return () => {
      if (binding) {
        binding.destroy();
        binding = null;
      }
    };
  }, [isEditorReady, ydoc, provider, side]);

  return (
    <div className={`relative flex h-full w-full flex-col ${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#fffdf8]'}`}>
      {isReadOnly && (
        <div className={`absolute inset-0 z-10 cursor-not-allowed ${theme === 'dark' ? 'bg-black/40' : 'bg-stone-100/50'}`} />
      )}

      <Editor
        height="100%"
        width="100%"
        language={monacoLang}
        theme={theme === 'dark' ? 'ca-dark' : 'light'}
        loading={<div className="flex items-center justify-center h-full text-gray-500">Initializing Editor...</div>}
        options={{
          readOnly: isReadOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          padding: { top: 16 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          renderLineHighlight: 'all',
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
          }
        }}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
      />
    </div>
  );
};

export default CodeEditor;
