
import React, { useState } from 'react';
import { generateExBuilderCode } from './services/geminiService';
import { GenerationResult, TabType, GenerationSettings } from './types';
import CodeBlock from './components/CodeBlock';
import LogViewer from './components/LogViewer';
import SettingsModal from './components/SettingsModal';
import ServerCodeViewer from './components/ServerCodeViewer';
import { 
  Code2, 
  Terminal, 
  Play, 
  Layout, 
  Send, 
  Loader2, 
  Cpu, 
  FileCode,
  AlertCircle,
  Settings,
  Server
} from 'lucide-react';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.CLX);
  const [error, setError] = useState<string | null>(null);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<GenerationSettings>({
    provider: 'gemini',
    modelName: 'gemini-3-pro-preview',
    temperature: 0.7,
    language: 'ko',
    includeComments: true,
    basePackage: 'com.example'
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      // Pass settings to the service
      const data = await generateExBuilderCode(prompt, settings);
      setResult(data);
      // Auto switch to logs or CLX
      setActiveTab(TabType.CLX);
    } catch (err: any) {
      setError(`Generation failed: ${err.message || 'Unknown error'}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />

      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            eXbuilder6 AI Studio
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-slate-300">{loading ? 'Processing...' : 'Ready'}</span>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Input Panel */}
        <section className="w-[350px] lg:w-[450px] border-r border-slate-800 flex flex-col bg-slate-900/30 p-6 gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Prompt Engineer
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Describe the UI component or logic you want to build in eXbuilder6. 
              The AI will generate the .clx XML and controller .js files.
            </p>
          </div>

          <div className="flex-1 relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Create a search filter with a date picker, a combo box for category, and a button to trigger search."
              className="w-full h-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none placeholder:text-slate-600 group-hover:border-slate-600"
            />
            <div className="absolute bottom-4 right-4 text-[10px] text-slate-600 font-mono">
              CTRL + ENTER to send
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Build Component
              </>
            )}
          </button>
        </section>

        {/* Right Side: Dashboard Panel */}
        <section className="flex-1 flex flex-col bg-slate-950 p-6 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <TabButton 
                active={activeTab === TabType.CLX} 
                onClick={() => setActiveTab(TabType.CLX)}
                icon={<FileCode className="w-4 h-4" />}
                label="Layout (.clx)"
              />
              <TabButton 
                active={activeTab === TabType.JS} 
                onClick={() => setActiveTab(TabType.JS)}
                icon={<Code2 className="w-4 h-4" />}
                label="Controller (.js)"
              />
              <TabButton 
                active={activeTab === TabType.SERVER} 
                onClick={() => setActiveTab(TabType.SERVER)}
                icon={<Server className="w-4 h-4" />}
                label="Server (.java)"
              />
              <TabButton 
                active={activeTab === TabType.LOGS} 
                onClick={() => setActiveTab(TabType.LOGS)}
                icon={<Terminal className="w-4 h-4" />}
                label="Build Logs"
              />
              <TabButton 
                active={activeTab === TabType.PREVIEW} 
                onClick={() => setActiveTab(TabType.PREVIEW)}
                icon={<Layout className="w-4 h-4" />}
                label="Live Preview"
              />
            </div>
            {result && (
              <div className="text-xs text-slate-500 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
                <Play className="w-3 h-3 text-emerald-500" />
                Output Ready
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden relative">
            {!result && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center">
                  <Cpu className="w-8 h-8 opacity-20" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Ready to build your next component</p>
                  <p className="text-xs opacity-50">Results will appear here once generated</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                  <Cpu className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-bold text-white tracking-tight">AI is Architecting...</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />
                    <span>Analyzing eXbuilder6 standard library</span>
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-ping delay-75" />
                    <span>Mapping state to XML</span>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="h-full flex flex-col gap-4">
                {activeTab === TabType.CLX && (
                  <CodeBlock title="eXbuilder6 Layout (XML)" language="xml" code={result.clxCode} />
                )}
                {activeTab === TabType.JS && (
                  <CodeBlock title="eXbuilder6 Controller (JavaScript)" language="javascript" code={result.jsCode} />
                )}
                {activeTab === TabType.SERVER && (
                  <ServerCodeViewer files={result.javaFiles || []} />
                )}
                {activeTab === TabType.LOGS && (
                  <LogViewer logs={result.logs} />
                )}
                {activeTab === TabType.PREVIEW && (
                  <div className="h-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Simulation Environment</span>
                      <span className="text-[10px] uppercase bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Mock Render</span>
                    </div>
                    <div className="flex-1 p-8 overflow-auto flex items-center justify-center bg-white/5 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]">
                       <div 
                         className="bg-slate-800 border border-slate-700 rounded shadow-2xl p-6 w-full max-w-lg min-h-[300px]"
                         dangerouslySetInnerHTML={{ __html: result.previewMock || '<div class="text-slate-500 flex flex-col items-center justify-center h-full gap-2"><p>Preview structure generated</p><p class="text-[10px]">Actual eXbuilder6 rendering requires runtime env</p></div>' }}
                       />
                    </div>
                    <div className="p-4 bg-slate-900 border-t border-slate-800">
                       <h4 className="text-xs font-bold text-slate-400 mb-1">Architecture Summary:</h4>
                       <p className="text-xs text-slate-500">{result.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="h-8 border-t border-slate-800 bg-slate-900 px-6 flex items-center justify-between text-[10px] text-slate-500 font-medium">
        <div className="flex items-center gap-4">
          <span>v1.0.0-alpha</span>
          <span className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> API Connected
          </span>
        </div>
        <div>Built with {settings.provider.toUpperCase()}</div>
      </footer>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default App;
