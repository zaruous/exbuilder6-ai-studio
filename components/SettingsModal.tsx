
import React, { useState, useEffect } from 'react';
import { X, Save, Sliders, Languages, MessageSquare, Package, Server, Globe } from 'lucide-react';
import { GenerationSettings, AIProvider } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GenerationSettings;
  onSave: (newSettings: GenerationSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<GenerationSettings>(settings);

  // Sync state when modal opens
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleProviderChange = (provider: AIProvider) => {
    let defaultModel = '';
    let defaultUrl = '';

    switch (provider) {
      case 'gemini':
        defaultModel = 'gemini-3-pro-preview';
        break;
      case 'openai':
        defaultModel = 'gpt-4o';
        defaultUrl = 'https://api.openai.com/v1';
        break;
      case 'ollama':
        defaultModel = 'llama3';
        defaultUrl = 'http://localhost:11434/v1';
        break;
      case 'web-service':
        defaultModel = ''; // Model usually defined on server side for custom web services
        defaultUrl = 'https://my-backend-api.com/generate';
        break;
    }

    setLocalSettings({
      ...localSettings,
      provider,
      modelName: defaultModel,
      baseUrl: defaultUrl,
      // API Key reset logic removed
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 shrink-0">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            Configuration
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* AI Provider Section */}
            <div className="space-y-4 border-b border-slate-800 pb-6">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    AI Provider
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {(['gemini', 'openai', 'ollama', 'web-service'] as AIProvider[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => handleProviderChange(p)}
                            className={`py-2 px-2 rounded-lg border text-xs font-semibold uppercase tracking-wide transition-all ${
                                localSettings.provider === p 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                             {p === 'openai' ? 'OpenAI / VLLM' : p === 'web-service' ? 'Web Service' : p}
                        </button>
                    ))}
                </div>

                {/* Dynamic Fields based on Provider */}
                <div className="space-y-3 bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                    {/* Base URL */}
                    {localSettings.provider !== 'gemini' && (
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                                <Globe className="w-3 h-3" /> 
                                {localSettings.provider === 'web-service' ? 'Endpoint URL' : 'API Base URL'}
                            </label>
                            <input 
                                type="text" 
                                value={localSettings.baseUrl || ''}
                                onChange={(e) => setLocalSettings({...localSettings, baseUrl: e.target.value})}
                                placeholder={localSettings.provider === 'ollama' ? "http://localhost:11434/v1" : "https://api.openai.com/v1"}
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
                            />
                            {localSettings.provider === 'ollama' && (
                                <p className="text-[10px] text-amber-500/80">
                                    Note: Ensure `OLLAMA_ORIGINS="*"` is set.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Model Name - Hide for Web Service as it's likely handled by the backend */}
                    {localSettings.provider !== 'web-service' && (
                      <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500">Model Name</label>
                          <input 
                              type="text" 
                              value={localSettings.modelName}
                              onChange={(e) => setLocalSettings({...localSettings, modelName: e.target.value})}
                              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
                          />
                      </div>
                    )}
                </div>
            </div>

            {/* Code Generation Settings */}
            <div className="space-y-6">
                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-500" />
                        Base Package
                    </label>
                    <input 
                        type="text" 
                        value={localSettings.basePackage}
                        onChange={(e) => setLocalSettings({...localSettings, basePackage: e.target.value})}
                        placeholder="com.example"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-600 font-mono"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-slate-300">Creativity (Temperature)</label>
                        <span className="text-xs text-blue-400 font-mono bg-blue-400/10 px-2 py-0.5 rounded">{localSettings.temperature.toFixed(1)}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1" 
                        value={localSettings.temperature}
                        onChange={(e) => setLocalSettings({...localSettings, temperature: parseFloat(e.target.value)})}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Languages className="w-4 h-4 text-slate-500" />
                        Output Language
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setLocalSettings({...localSettings, language: 'ko'})}
                            className={`py-2 px-3 rounded-lg border text-sm transition-all ${localSettings.language === 'ko' ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                        >
                            Korean (한국어)
                        </button>
                        <button 
                            onClick={() => setLocalSettings({...localSettings, language: 'en'})}
                            className={`py-2 px-3 rounded-lg border text-sm transition-all ${localSettings.language === 'en' ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                        >
                            English
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-800">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2 cursor-pointer">
                        <MessageSquare className="w-4 h-4 text-slate-500" />
                        Include Detailed Comments
                    </label>
                    <input 
                        type="checkbox"
                        checked={localSettings.includeComments}
                        onChange={(e) => setLocalSettings({...localSettings, includeComments: e.target.checked})}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                    />
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3 shrink-0">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={() => { onSave(localSettings); onClose(); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
                <Save className="w-4 h-4" />
                Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
