
import React, { useState } from 'react';
import { X, Share2, Type, AlignLeft, User } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string, description: string, author: string) => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && description.trim()) {
      onConfirm(title, description, author);
      // Reset form
      setTitle('');
      setDescription('');
      setAuthor('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-500" />
            Register Component
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-sm text-slate-400">
            Share your generated component with the community. Others will be able to search, view, and use your code.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-2">
                <Type className="w-3 h-3" /> Title
            </label>
            <input 
              required
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Advanced Search Grid"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-2">
                <AlignLeft className="w-3 h-3" /> Description
            </label>
            <textarea 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the functionality, inputs, and usage of this component..."
              className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-600 resize-none"
            />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-2">
                <User className="w-3 h-3" /> Author Name (Optional)
             </label>
             <input 
              type="text" 
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Anonymous"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-600"
             />
          </div>

          <div className="pt-2 flex gap-3 justify-end">
            <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
                Cancel
            </button>
            <button 
                type="submit"
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-500/20 transition-all"
            >
                Register Code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;
