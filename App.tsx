
import React, { useState, useEffect } from 'react';
import { generateExBuilderCode, refineDesignDoc, refineCode, refineJavaFiles } from './services/geminiService';
import { getSharedComponents, registerComponent } from './services/communityService';
import { getStoredUser, logout } from './services/authService';
import { GenerationResult, TabType, GenerationSettings, SharedComponent, GenerationStage, AuthUser } from './types';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import { SAMPLE_DESIGN_DOC, SAMPLE_CLX, SAMPLE_JS, SAMPLE_SQL, getSampleJavaFiles, PROMPT_PLACE_HOLDER } from './constants/sampleCode';
import CodeBlock from './components/CodeBlock';
import LogViewer from './components/LogViewer';
import SettingsModal from './components/SettingsModal';
import RegisterModal from './components/RegisterModal';
import ExploreView from './components/ExploreView';
import ServerCodeViewer from './components/ServerCodeViewer';
import DesignDocEditor from './components/DesignDocEditor';
import AdminPage from './components/AdminPage';
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
  Server,
  Globe,
  Share2,
  Search,
  Database,
  ChevronDown,
  Check,
  FileText,
  Sidebar,
  PanelRight,
  PanelLeft,
  Shield,
} from 'lucide-react';

type ViewMode = 'generator' | 'explore' | 'admin';
type AuthView = 'login' | 'register';

const SETTINGS_KEY = 'exbuilder_settings';

const STAGE_OPTIONS: { value: GenerationStage; label: string; icon: any }[] = [
  { value: 'design', label: 'Design', icon: FileText },
  { value: 'sql', label: 'SQL', icon: Database },
  { value: 'server', label: 'Server', icon: Server },
  { value: 'layout', label: 'Layout', icon: Layout },
  { value: 'script', label: 'Script', icon: Code2 },
];

const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getStoredUser());
  const [authView, setAuthView] = useState<AuthView>('login');
  const [viewMode, setViewMode] = useState<ViewMode>('generator');

  // Generator State
  const [prompt, setPrompt] = useState(PROMPT_PLACE_HOLDER);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.DESIGN_DOC);
  const [error, setError] = useState<string | null>(null);
  const [selectedStages, setSelectedStages] = useState<GenerationStage[]>([]);
  const [isStageMenuOpen, setIsStageMenuOpen] = useState(false);
  const [sidePannelVisible, setSidePannelVisible] = useState(true);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<GenerationSettings>(() => {
    const defaultSettings: GenerationSettings = {
      provider: 'gemini',
      providerConfigs: {
        gemini: { modelName: 'gemini-3-pro-preview' },
        openai: { modelName: 'gpt-4o', baseUrl: 'https://api.openai.com/v1' },
        ollama: { modelName: 'glm-5:cloud', baseUrl: 'http://localhost:11434/v1' },
        'web-service': { modelName: 'glm-5:cloud', baseUrl: 'http://localhost:8080/api/generate' }
      },
      temperature: 0.3,
      language: 'ko',
      includeComments: true,
      basePackage: 'com.example',
      dbms: 'oracle'
    };

    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge saved with defaults to handle version differences
        return {
          ...defaultSettings,
          ...parsed,
          // Deep merge providerConfigs specifically
          providerConfigs: {
            ...defaultSettings.providerConfigs,
            ...(parsed.providerConfigs || {})
          }
        };
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return defaultSettings;
  });

  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Community State
  const [sharedItems, setSharedItems] = useState<SharedComponent[]>([]);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Load initial shared items
  useEffect(() => {
    refreshCommunity();
  }, []);

  const refreshCommunity = async () => {
    const items = await getSharedComponents();
    setSharedItems(items);
  };

  const toggleStage = (stage: GenerationStage) => {
    setSelectedStages(prev =>
      prev.includes(stage)
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null); // Clear previous
    setIsStageMenuOpen(false); // Close stage menu

    // Determine initial tab based on selection
    if (selectedStages.length > 0) {
      const first = selectedStages[0];
      if (first === 'design') setActiveTab(TabType.DESIGN_DOC);
      else if (first === 'sql') setActiveTab(TabType.SQL);
      else if (first === 'server') setActiveTab(TabType.SERVER);
      else if (first === 'layout') setActiveTab(TabType.CLX);
      else if (first === 'script') setActiveTab(TabType.JS);
    } else {
      setActiveTab(TabType.DESIGN_DOC); // Default to Design if generating all
    }

    try {
      const data = await generateExBuilderCode(prompt, settings, (stage, partial) => {
        // Real-time progress update
        setResult(prev => ({
          ...partial,
          logs: partial.logs || [],
          explanation: partial.explanation || "",
          javaFiles: partial.javaFiles || []
        } as GenerationResult));

        // Auto-switch tabs as we progress
        if (stage === 'design') setActiveTab(TabType.DESIGN_DOC);
        if (stage === 'sql') setActiveTab(TabType.SQL);
        if (stage === 'server') setActiveTab(TabType.SERVER);
        if (stage === 'layout') setActiveTab(TabType.CLX);
        if (stage === 'script') setActiveTab(TabType.JS);
      }, selectedStages);

      setResult(data);
    } catch (err: any) {
      setError(`Generation failed: ${err.message || 'Unknown error'}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterConfirm = async (
    title: string,
    description: string,
    author: string,
    manualResult?: GenerationResult
  ) => {

    const targetResult = manualResult || result;

    if (!targetResult) {
      alert('No code to register!');
      return;
    }

    setIsRegisterOpen(false);
    await registerComponent(title, description, author, targetResult);
    await refreshCommunity();

    // Switch to explore view to see the new item
    setViewMode('explore');
  };

  const handleLoadFromCommunity = (item: SharedComponent) => {
    setResult(item.generationResult);
    setPrompt(`Loaded from: ${item.title}`); // Update prompt just for visual context
    setViewMode('generator');
    setActiveTab(TabType.PREVIEW);
  };

  // --- Dynamic Synthesis Helpers ---
  const getSynthesizedDesignDoc = () => {
    if (result?.designDoc) return result.designDoc;
    return SAMPLE_DESIGN_DOC;
  };

  const getSynthesizedClx = () => {
    if (result?.clxCode) return result.clxCode;
    return SAMPLE_CLX;
  };

  const getSynthesizedJs = () => {
    if (result?.jsCode) return result.jsCode;
    return SAMPLE_JS;
  };

  const getSynthesizedSql = () => {
    if (result?.sqlCode) return result.sqlCode;
    return SAMPLE_SQL;
  };

  const getSynthesizedJavaFiles = (): import('./types').JavaFile[] => {
    if (result?.javaFiles && result.javaFiles.length > 0) return result.javaFiles;
    const pkg = settings.basePackage || 'com.example';
    return getSampleJavaFiles(pkg);
  };

  // 미인증 상태: 로그인/회원가입 화면 렌더링
  if (!authUser) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onGoToLogin={() => setAuthView('login')}
          onVerified={() => setAuthView('login')}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={(user) => setAuthUser(user)}
        onGoToRegister={() => setAuthView('register')}
      />
    );
  }

  const handleLogout = () => {
    logout();
    setAuthUser(null);
    setAuthView('login');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onConfirm={handleRegisterConfirm}
        hasResult={!!result}
      />

      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewMode('generator')}>
          <div className="bg-blue-600 p-2 rounded-lg">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent hidden sm:block">
            eXbuilder6 AI Studio
          </h1>
        </div>

        {/* Navigation / Actions */}
        <div className="flex items-center gap-3 text-sm">

          {/* View Switcher */}
          <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex gap-1 mr-4">
            <button
              onClick={() => setViewMode('generator')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'generator' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <Code2 className="w-4 h-4" /> Studio
            </button>
            <button
              onClick={() => setViewMode('explore')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'explore' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <Search className="w-4 h-4" /> Explore
            </button>
            {authUser.role === 'ADMIN' && (
              <button
                onClick={() => setViewMode('admin')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'admin' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                <Shield className="w-4 h-4" /> 관리
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 hidden sm:flex">
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

          {/* User Info & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
            <span className="text-xs text-slate-400 hidden sm:block">{authUser.name}</span>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
              title="로그아웃"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Content */}
      <main className="flex-1 overflow-hidden relative">

        {/* VIEW 0: ADMIN */}
        {viewMode === 'admin' && authUser.role === 'ADMIN' && (
          <div className="absolute inset-0 z-20 bg-slate-950 animate-in fade-in duration-200">
            <AdminPage />
          </div>
        )}

        {/* VIEW 1: EXPLORE */}
        {viewMode === 'explore' && (
          <div className="absolute inset-0 z-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <ExploreView
              items={sharedItems}
              onLoadComponent={handleLoadFromCommunity}
              onRefreshItems={refreshCommunity}
            />
          </div>
        )}

        {/* VIEW 2: GENERATOR (Original Layout) */}
        <div className={`flex h-full w-full ${viewMode !== 'generator' ? 'hidden' : ''}`}>
          {/* Left Side: Input Panel */}
          {sidePannelVisible ? (
            <section className="w-[350px] lg:w-[450px] border-r border-slate-800 flex flex-col bg-slate-900/30 p-6 gap-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <PanelLeft 
                  cursor={'pointer'}
                  className="w-5 h-5 text-slate-400" onClick={() => setSidePannelVisible(!sidePannelVisible)} />
                    Prompt Engineer
                </h2>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Describe the UI component or logic you want to build in eXbuilder6.
                  The AI will generate the design, sql, server, .clx XML and controller.js files.
                </p>
              </div>

              {/* Stage Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsStageMenuOpen(!isStageMenuOpen)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-xs text-slate-300 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      {selectedStages.length === 0
                        ? 'Generate All Components'
                        : `Target: ${selectedStages.map(s => s.toUpperCase()).join(', ')}`}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isStageMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isStageMenuOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-slate-800 bg-slate-800/20">
                      <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Select Stages (Empty = All)</span>
                    </div>
                    <div className="p-1">
                      {STAGE_OPTIONS.map((opt) => {
                        const isSelected = selectedStages.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            onClick={() => toggleStage(opt.value)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${isSelected ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                          >
                            <div className="flex items-center gap-2">
                              <opt.icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                              <span>{opt.label}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                    {selectedStages.length > 0 && (
                      <button
                        onClick={() => setSelectedStages([])}
                        className="w-full py-2 text-[10px] text-slate-500 hover:text-white hover:bg-slate-800 border-t border-slate-800 transition-all"
                      >
                        Reset to Default (All)
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 relative group">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={PROMPT_PLACE_HOLDER}
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
          ) : (
          <div className="w-[60px] lg:w-[60px] border-r border-slate-800 flex flex-col bg-slate-900/30 p-6 gap-6">
            <button onClick={() => setSidePannelVisible(true)}>
              <PanelRight
                  cursor={'pointer'}
                  className="w-5 h-5 text-slate-400" onClick={() => setSidePannelVisible(!sidePannelVisible)} />

            </button>
          </div>)}

          {/* Right Side: Dashboard Panel */}
          <section className="flex-1 flex flex-col bg-slate-950 p-6 overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center justify-between mb-4">

              <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <TabButton
                  active={activeTab === TabType.DESIGN_DOC}
                  onClick={() => setActiveTab(TabType.DESIGN_DOC)}
                  icon={<FileText className="w-4 h-4" />}
                  label="Design"
                />
                <TabButton
                  active={activeTab === TabType.SQL}
                  onClick={() => setActiveTab(TabType.SQL)}
                  icon={<Database className="w-4 h-4" />}
                  label="SQL"
                />
                 <TabButton
                  active={activeTab === TabType.SERVER}
                  onClick={() => setActiveTab(TabType.SERVER)}
                  icon={<Server className="w-4 h-4" />}
                  label="Server"
                />
                <TabButton
                  active={activeTab === TabType.CLX}
                  onClick={() => setActiveTab(TabType.CLX)}
                  icon={<FileCode className="w-4 h-4" />}
                  label="Layout"
                />
                <TabButton
                  active={activeTab === TabType.JS}
                  onClick={() => setActiveTab(TabType.JS)}
                  icon={<Code2 className="w-4 h-4" />}
                  label="Script"
                />
                <TabButton
                  active={activeTab === TabType.LOGS}
                  onClick={() => setActiveTab(TabType.LOGS)}
                  icon={<Terminal className="w-4 h-4" />}
                  label="Logs"
                />
                <TabButton
                  active={activeTab === TabType.PREVIEW}
                  onClick={() => setActiveTab(TabType.PREVIEW)}
                  icon={<Layout className="w-4 h-4" />}
                  label="Preview"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRegisterOpen(true)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold ${result ? 'bg-emerald-600/10 border-emerald-600/50 text-emerald-500 hover:bg-emerald-600 hover:text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                >
                  {result ? <Share2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 flex items-center justify-center">+</div>}
                  {result ? 'Register / Share' : 'Upload Code'}
                </button>
                {result && (
                  <div className="text-xs text-slate-500 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
                    <Play className="w-3 h-3 text-emerald-500" />
                    Output Ready
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">

              {/* ── Loading overlay ── */}
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

              {/* ── Design Doc ── */}
              {activeTab === TabType.DESIGN_DOC && (
                <div className="h-full flex flex-col">
                  <DesignDocEditor
                    initialContent={getSynthesizedDesignDoc()}
                    onSave={(content) => setResult(prev => prev ? { ...prev, designDoc: content } : { logs: [], explanation: 'Manual update', designDoc: content })}
                    onRefine={async (instruction, currentContent) => {
                      const refined = await refineDesignDoc(currentContent, instruction, settings);
                      setResult(prev => prev ? { ...prev, designDoc: refined } : { logs: [], explanation: 'AI Refined', designDoc: refined });
                      return refined;
                    }}
                  />
                </div>
              )}

              {/* ── Layout (CLX) ── */}
              {activeTab === TabType.CLX && (
                <div className="h-full flex flex-col">
                  <CodeBlock
                    title="eXbuilder6 Layout (XML)"
                    language="xml"
                    code={getSynthesizedClx()}
                    onChange={(code) => setResult(prev => prev ? { ...prev, clxCode: code } : { logs: [], explanation: 'Manual edit', clxCode: code })}
                    onRefine={async (instruction, currentCode) => {
                      const refined = await refineCode(currentCode, instruction, 'xml', settings);
                      setResult(prev => prev ? { ...prev, clxCode: refined } : { logs: [], explanation: 'AI Refined', clxCode: refined });
                      return refined;
                    }}
                  />
                </div>
              )}

              {/* ── Script (JS) ── */}
              {activeTab === TabType.JS && (
                <div className="h-full flex flex-col">
                  <CodeBlock
                    title="eXbuilder6 Controller (JavaScript)"
                    language="javascript"
                    code={getSynthesizedJs()}
                    onChange={(code) => setResult(prev => prev ? { ...prev, jsCode: code } : { logs: [], explanation: 'Manual edit', jsCode: code })}
                    onRefine={async (instruction, currentCode) => {
                      const refined = await refineCode(currentCode, instruction, 'javascript', settings);
                      setResult(prev => prev ? { ...prev, jsCode: refined } : { logs: [], explanation: 'AI Refined', jsCode: refined });
                      return refined;
                    }}
                  />
                </div>
              )}

              {/* ── SQL ── */}
              {activeTab === TabType.SQL && (
                <div className="h-full flex flex-col">
                  <CodeBlock
                    title="Database Script (SQL)"
                    language="sql"
                    code={getSynthesizedSql()}
                    onChange={(code) => setResult(prev => prev ? { ...prev, sqlCode: code } : { logs: [], explanation: 'Manual edit', sqlCode: code })}
                    onRefine={async (instruction, currentCode) => {
                      const refined = await refineCode(currentCode, instruction, 'sql', settings);
                      setResult(prev => prev ? { ...prev, sqlCode: refined } : { logs: [], explanation: 'AI Refined', sqlCode: refined });
                      return refined;
                    }}
                  />
                </div>
              )}

              {/* ── Server (Java) ── */}
              {activeTab === TabType.SERVER && (
                <div className="h-full flex flex-col">
                  <ServerCodeViewer
                    files={getSynthesizedJavaFiles()}
                    onFilesUpdate={(files) => setResult(prev => prev ? { ...prev, javaFiles: files } : { logs: [], explanation: 'Manual edit', javaFiles: files })}
                    onRefine={async (instruction, currentFiles) => {
                      const refined = await refineJavaFiles(currentFiles, instruction, settings);
                      setResult(prev => prev ? { ...prev, javaFiles: refined } : { logs: [], explanation: 'AI Refined', javaFiles: refined });
                      return refined;
                    }}
                  />
                </div>
              )}

              {/* ── Logs (result 있을 때만) ── */}
              {activeTab === TabType.LOGS && (
                <div className="h-full flex flex-col">
                  {result
                    ? <LogViewer logs={result.logs} />
                    : <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-4">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center">
                        <Cpu className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-sm font-medium">Generate code to view logs</p>
                    </div>
                  }
                </div>
              )}

              {/* ── Preview (result 있을 때만) ── */}
              {activeTab === TabType.PREVIEW && (
                <div className="h-full flex flex-col">
                  {result ? (
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
                  ) : (
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
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-8 border-t border-slate-800 bg-slate-900 px-6 flex items-center justify-between text-[10px] text-slate-500 font-medium z-20">
        <div className="flex items-center gap-4">
          <span>v1.2.0-beta</span>
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
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
  >
    {icon}
    {label}
  </button>
);

export default App;
