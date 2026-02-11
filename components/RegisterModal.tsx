
import React, { useState, useEffect } from 'react';
import { X, Share2, Type, AlignLeft, User, Code, FilePlus, Trash2, Upload } from 'lucide-react';
import { GenerationResult, JavaFile } from '../types';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string, description: string, author: string, manualResult?: GenerationResult) => void;
  hasResult: boolean;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onConfirm, hasResult }) => {
  // Metadata State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');

  // Mode State (Share Current vs Manual Upload)
  const [mode, setMode] = useState<'share' | 'upload'>(hasResult ? 'share' : 'upload');

  // Manual Upload State
  const [manualClx, setManualClx] = useState('');
  const [manualJs, setManualJs] = useState('');
  const [manualJavaFiles, setManualJavaFiles] = useState<JavaFile[]>([]);
  
  // Temp Java File State
  const [tempJavaName, setTempJavaName] = useState('');
  const [tempJavaContent, setTempJavaContent] = useState('');

  useEffect(() => {
    if (isOpen) {
        // Reset or set default mode based on availability
        setMode(hasResult ? 'share' : 'upload');
    }
  }, [isOpen, hasResult]);

  if (!isOpen) return null;

  const handleAddJavaFile = () => {
    if (!tempJavaName.trim() || !tempJavaContent.trim()) return;
    
    // Simple heuristic for package
    const packageMatch = tempJavaContent.match(/package\s+([a-zA-Z0-9_.]+);/);
    const packagePath = packageMatch ? packageMatch[1] : 'com.example.manual';
    
    // Heuristic for type
    let type: 'controller' | 'service' | 'model' = 'model';
    if (tempJavaName.includes('Controller')) type = 'controller';
    else if (tempJavaName.includes('Service')) type = 'service';

    const newFile: JavaFile = {
        fileName: tempJavaName,
        content: tempJavaContent,
        packagePath,
        type
    };

    setManualJavaFiles([...manualJavaFiles, newFile]);
    setTempJavaName('');
    setTempJavaContent('');
  };

  const removeJavaFile = (idx: number) => {
    const newFiles = [...manualJavaFiles];
    newFiles.splice(idx, 1);
    setManualJavaFiles(newFiles);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
        let manualResult: GenerationResult | undefined = undefined;

        if (mode === 'upload') {
            manualResult = {
                clxCode: manualClx,
                jsCode: manualJs,
                javaFiles: manualJavaFiles,
                logs: ['Manual upload'],
                explanation: 'User uploaded component',
                previewMock: `<div style="padding:20px; color:#aaa; border:1px dashed #555; text-align:center;">Preview not available for manual uploads</div>`
            };
        }

        onConfirm(title, description, author, manualResult);
        
        // Reset form
        setTitle('');
        setDescription('');
        setAuthor('');
        setManualClx('');
        setManualJs('');
        setManualJavaFiles([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 shrink-0">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            {mode === 'share' ? <Share2 className="w-5 h-5 text-emerald-500" /> : <Upload className="w-5 h-5 text-blue-500" />}
            {mode === 'share' ? 'Share Generated Component' : 'Upload Custom Code'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30">
            <button 
                onClick={() => hasResult && setMode('share')}
                disabled={!hasResult}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'share' ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5' : 'text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed'}`}
            >
                Current AI Result
            </button>
            <button 
                onClick={() => setMode('upload')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'upload' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Manual Upload
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Common Metadata Fields */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                    <label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-2">
                        <Type className="w-3 h-3" /> Title
                    </label>
                    <input 
                    required
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Advanced Search Grid"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-600 placeholder:text-slate-600"
                    />
                </div>
                <div className="space-y-2 col-span-2">
                    <label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-2">
                        <AlignLeft className="w-3 h-3" /> Description
                    </label>
                    <textarea 
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain the functionality, inputs, and usage..."
                    className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-600 placeholder:text-slate-600 resize-none"
                    />
                </div>
                <div className="space-y-2 col-span-2">
                    <label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-2">
                        <User className="w-3 h-3" /> Author Name
                    </label>
                    <input 
                    type="text" 
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Anonymous"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-600 placeholder:text-slate-600"
                    />
                </div>
            </div>

            {/* Manual Upload Fields */}
            {mode === 'upload' && (
                <div className="space-y-6 pt-4 border-t border-slate-800">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-blue-400 flex items-center gap-2">
                            <Code className="w-3 h-3" /> CLX Layout (XML)
                        </label>
                        <textarea 
                            value={manualClx}
                            onChange={(e) => setManualClx(e.target.value)}
                            placeholder="Paste .clx XML content here..."
                            className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-yellow-400 flex items-center gap-2">
                            <Code className="w-3 h-3" /> Controller Script (JS)
                        </label>
                        <textarea 
                            value={manualJs}
                            onChange={(e) => setManualJs(e.target.value)}
                            placeholder="Paste .js content here..."
                            className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Java Files Section */}
                    <div className="space-y-3 bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                        <label className="text-xs font-semibold uppercase text-red-400 flex items-center gap-2">
                            <Code className="w-3 h-3" /> Java Source Files
                        </label>
                        
                        {/* List existing added files */}
                        {manualJavaFiles.length > 0 && (
                            <div className="flex flex-col gap-2 mb-2">
                                {manualJavaFiles.map((f, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-700">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="text-xs font-bold text-slate-300">{f.fileName}</span>
                                            <span className="text-[10px] text-slate-500 truncate">{f.packagePath}</span>
                                        </div>
                                        <button type="button" onClick={() => removeJavaFile(idx)} className="text-slate-500 hover:text-red-400">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add new file form */}
                        <div className="grid grid-cols-3 gap-2">
                            <input 
                                placeholder="FileName.java"
                                value={tempJavaName}
                                onChange={(e) => setTempJavaName(e.target.value)}
                                className="col-span-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            />
                            <textarea 
                                placeholder="Paste Java content..."
                                value={tempJavaContent}
                                onChange={(e) => setTempJavaContent(e.target.value)}
                                className="col-span-2 h-20 bg-slate-950 border border-slate-700 rounded p-2 text-[10px] font-mono text-slate-300 resize-none"
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={handleAddJavaFile}
                            className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded flex items-center justify-center gap-1"
                        >
                            <FilePlus className="w-3 h-3" /> Add Java File
                        </button>
                    </div>
                </div>
            )}
            
            {/* Footer Actions */}
            <div className="pt-4 flex gap-3 justify-end border-t border-slate-800 mt-4">
                <button 
                    type="button" 
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button 
                    type="submit"
                    className={`px-6 py-2 text-white text-sm font-semibold rounded-lg shadow-lg transition-all ${
                        mode === 'share' 
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' 
                        : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                    }`}
                >
                    {mode === 'share' ? 'Register Generated Code' : 'Upload Manual Code'}
                </button>
            </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
