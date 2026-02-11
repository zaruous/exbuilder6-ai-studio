
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { JavaFile } from '../types';
import { Folder, FileCode, ChevronRight, ChevronDown, Database, Server, Box } from 'lucide-react';

interface ServerCodeViewerProps {
  files: JavaFile[];
}

const ServerCodeViewer: React.FC<ServerCodeViewerProps> = ({ files }) => {
  const [selectedFile, setSelectedFile] = useState<JavaFile | null>(files[0] || null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Helper to build a tree structure from flat file list
  const buildTree = (files: JavaFile[]) => {
    const root: any = {};
    
    files.forEach(file => {
      // Combine package + filename to create full path parts
      // e.g., com.example.model + User.java -> ['com', 'example', 'model', 'User.java']
      const parts = [...file.packagePath.split('.'), file.fileName];
      
      let current = root;
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = index === parts.length - 1 ? { __file: file } : {};
        }
        current = current[part];
      });
    });
    return root;
  };

  const tree = buildTree(files);

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  // Auto-expand all nodes on first load
  useEffect(() => {
    const allKeys: string[] = [];
    const traverse = (node: any, prefix: string) => {
        Object.keys(node).forEach(key => {
            if (key !== '__file') {
                const id = prefix ? `${prefix}.${key}` : key;
                allKeys.push(id);
                traverse(node[key], id);
            }
        });
    };
    traverse(tree, '');
    setExpandedNodes(new Set(allKeys));
  }, [files]);


  const renderTree = (node: any, path: string = '', level: number = 0) => {
    return Object.keys(node).sort((a, b) => {
        // Files last
        const aIsFile = !!node[a].__file;
        const bIsFile = !!node[b].__file;
        if (aIsFile && !bIsFile) return 1;
        if (!aIsFile && bIsFile) return -1;
        return a.localeCompare(b);
    }).map(key => {
      const isFile = !!node[key].__file;
      const id = path ? `${path}.${key}` : key;
      const isExpanded = expandedNodes.has(id);
      const fileData = node[key].__file as JavaFile;

      if (isFile) {
        let Icon = FileCode;
        if (fileData.type === 'model') Icon = Database;
        if (fileData.type === 'controller') Icon = Box;
        if (fileData.type === 'service') Icon = Server;

        return (
          <div 
            key={id}
            onClick={() => setSelectedFile(fileData)}
            className={`flex items-center gap-2 py-1 px-2 cursor-pointer text-sm transition-colors rounded ${
              selectedFile === fileData ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            style={{ paddingLeft: `${level * 16 + 12}px` }}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{key}</span>
          </div>
        );
      }

      return (
        <div key={id}>
          <div 
            onClick={() => toggleNode(id)}
            className="flex items-center gap-1 py-1 px-2 cursor-pointer text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded select-none"
            style={{ paddingLeft: `${level * 16}px` }}
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <Folder className="w-4 h-4 text-amber-500/80 shrink-0" />
            <span className="truncate">{key}</span>
          </div>
          {isExpanded && renderTree(node[key], id, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="flex h-full border border-slate-700 rounded-lg overflow-hidden bg-[#1e293b]">
      {/* File Tree Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-3 border-b border-slate-800 bg-slate-950/50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Package Explorer</span>
        </div>
        <div className="flex-1 overflow-auto p-2">
            {files.length === 0 ? (
                <div className="text-slate-600 text-xs p-2">No java files generated.</div>
            ) : (
                renderTree(tree)
            )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
         <div className="flex justify-between items-center px-4 py-2 bg-slate-800 border-b border-slate-700 shrink-0">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                {selectedFile ? (
                    <>
                        <FileCode className="w-3 h-3" />
                        {selectedFile.fileName}
                    </>
                ) : 'Select a file'}
            </span>
            {selectedFile && (
                <button 
                onClick={() => navigator.clipboard.writeText(selectedFile.content)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                Copy Content
                </button>
            )}
        </div>
        <div className="flex-1 overflow-hidden">
            <Editor
                height="100%"
                defaultLanguage="java"
                value={selectedFile?.content || '// Select a file from the explorer'}
                theme="vs-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    fontFamily: "'Fira Code', monospace",
                    readOnly: true
                }}
            />
        </div>
      </div>
    </div>
  );
};

export default ServerCodeViewer;
