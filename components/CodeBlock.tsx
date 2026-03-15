
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import RefinePromptBar from './RefinePromptBar';

interface CodeBlockProps {
  code: string;
  language: 'xml' | 'javascript' | 'sql';
  title: string;
  onChange?: (code: string) => void;
  onRefine?: (instruction: string, currentCode: string) => Promise<string>;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, title, onChange, onRefine }) => {
  const [currentCode, setCurrentCode] = useState(code);

  useEffect(() => {
    setCurrentCode(code);
  }, [code]);

  const handleChange = (value: string | undefined) => {
    const v = value || '';
    setCurrentCode(v);
    onChange?.(v);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentCode);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e293b] rounded-lg border border-slate-700 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-800 border-b border-slate-700 shrink-0">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <button
          onClick={copyToClipboard}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Copy Code
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage={language}
          value={currentCode}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            fontFamily: "'Fira Code', monospace",
            readOnly: false,
          }}
        />
      </div>

      {onRefine && (
        <RefinePromptBar
          tabLabel={title}
          onApply={async (instruction) => {
            const refined = await onRefine(instruction, currentCode);
            setCurrentCode(refined);
            onChange?.(refined);
            return refined;
          }}
        />
      )}
    </div>
  );
};

export default CodeBlock;
