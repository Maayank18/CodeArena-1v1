import React, { useEffect, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { vscodeDark, vscodeLightInit } from '@uiw/codemirror-theme-vscode';
import { yCollab } from 'y-codemirror.next';
import * as Y from 'yjs';
import { useTheme } from '../context/ThemeContext.jsx';
import { indentUnit } from '@codemirror/language';
import { EditorState } from '@codemirror/state';

const softLightEditorTheme = vscodeLightInit({
  settings: {
    background: '#fffdf8',
    foreground: '#1f2937',
    caret: '#2563eb',
    selection: '#dbeafe',
    selectionMatch: '#bfdbfe',
    gutterBackground: '#fafaf9',
    gutterForeground: '#94a3b8',
    gutterActiveForeground: '#334155',
    lineHighlight: '#ebe7de',
  },
});

const CodeEditor = ({ roomId: _roomId, side, isReadOnly, ydoc, provider, language }) => {
  const { theme } = useTheme();

  const { ytext, undoManager } = useMemo(() => {
    const text = ydoc.getText(`code-${side}`);
    const manager = new Y.UndoManager(text);
    return { ytext: text, undoManager: manager };
  }, [ydoc, side]);

  const languageExtension = useMemo(() => {
    switch (language) {
      case 'javascript':
        return javascript({ jsx: true });
      case 'python':
        return python();
      case 'cpp':
        return cpp();
      case 'java':
        return java();
      default:
        return javascript();
    }
  }, [language]);

  const editorTheme = theme === 'dark' ? vscodeDark : softLightEditorTheme;
  const extensions = useMemo(() => ([
    languageExtension,
    yCollab(ytext, provider?.awareness, { undoManager }),
    EditorState.tabSize.of(4),
    indentUnit.of("    "),
  ]), [languageExtension, provider?.awareness, undoManager, ytext]);

  useEffect(() => () => {
    undoManager.destroy();
  }, [undoManager]);

  return (
    <>
      {/* Legacy Bright Theme Editor Surface (for quick reversal): bg-[#1e1e1e] */}
    <div className={`relative flex h-full min-h-0 w-full flex-col overflow-hidden ${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-[#fffdf8]'}`}>
      {isReadOnly && (
        <div className={`absolute inset-0 z-10 cursor-not-allowed ${theme === 'dark' ? 'bg-black/40' : 'bg-stone-100/50'}`} />
      )}

      <CodeMirror
        className="min-h-0 flex-1 overflow-hidden text-xs sm:text-sm md:text-base"
        height="100%"
        theme={editorTheme}
        extensions={extensions}
        editable={!isReadOnly}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          history: true,
          drawSelection: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          historyKeymap: true,
          completionKeymap: true,
        }}
      />
    </div>
    </>
  );
};

export default CodeEditor;

// Version-2.0