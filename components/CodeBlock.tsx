
import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeBlockProps {
  code: string;
  language: 'xml' | 'javascript';
  title: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, title }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    // Simple visual feedback could be added here, but for now we'll stick to the existing behavior or just silent copy
    // alert('Copied to clipboard!'); 
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
          value={code}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            fontFamily: "'Fira Code', monospace",
            readOnly: false // Allow users to make edits if they want to copy modified code
          }}
        />
      </div>
    </div>
  );
};

export default CodeBlock;
