import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp, Sparkles, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';

interface RefinePromptBarProps {
  tabLabel: string;
  placeholder?: string;
  onApply: (prompt: string) => Promise<string>;
  onResponse?: (response: string, isError: boolean) => void;
  disabled?: boolean;
  defaultExpanded?: boolean;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const RefinePromptBar: React.FC<RefinePromptBarProps> = ({
  tabLabel,
  placeholder = '수정 요청을 입력하세요 (예: 검증 추가, 슬라이드 재구성, 서비스 테이블 보완...)',
  onApply,
  onResponse,
  disabled = false,
  defaultExpanded = false
}) => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 텍스트 입력 시 높이 자동 조절
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [prompt]);

  const handleApply = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || status === 'loading') return;
    setStatus('loading');
    setStatusMsg(null);
    try {
      const result = await onApply(trimmed);
      setStatus('success');
      setStatusMsg('문서가 성공적으로 업데이트되었습니다.');
      setPrompt('');
      onResponse?.(result, false);
    } catch (err) {
      console.error('Refine failed:', err);
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setStatus('error');
      setStatusMsg(errMsg);
      onResponse?.(errMsg, true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleApply();
    }
  };

  const reset = () => {
    setStatus('idle');
    setStatusMsg(null);
  };

  return (
    <div className="shrink-0 border-t border-slate-800/80">
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all group"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 group-hover:text-violet-300 transition-colors" />
            <span className="text-slate-300 group-hover:text-white transition-colors">AI Refine</span>
          </div>
          <span className="text-slate-600">—</span>
          <span className="text-slate-500">{tabLabel}</span>
          {status === 'success' && (
            <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Updated
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1 text-red-400 text-[10px] font-bold bg-red-500/10 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" /> Error
            </span>
          )}
        </div>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 transition-transform" />
          : <ChevronDown className="w-3.5 h-3.5 transition-transform" />}
      </button>

      {/* Expanded Panel */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 space-y-2.5 bg-slate-900/60 backdrop-blur-sm">
          {/* Status Message */}
          {statusMsg && (
            <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-xs border ${
              status === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}>
              {status === 'success'
                ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              <span className="leading-relaxed">{statusMsg}</span>
              <button onClick={reset} className="ml-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => { setPrompt(e.target.value); if (status !== 'idle') reset(); }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled || status === 'loading'}
                rows={1}
                className="w-full bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 focus:border-violet-500/60 rounded-xl px-4 py-3 pr-12 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30 resize-none transition-all disabled:opacity-50 leading-relaxed"
                style={{ minHeight: '48px' }}
              />
              {prompt.length > 0 && (
                <span className="absolute bottom-2 right-3 text-[10px] text-slate-600 font-mono select-none">
                  {prompt.length}
                </span>
              )}
            </div>

            <button
              onClick={handleApply}
              disabled={disabled || status === 'loading' || !prompt.trim()}
              className={`shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg active:scale-95 ${
                status === 'loading'
                  ? 'bg-violet-700/60 text-violet-300 cursor-wait'
                  : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/20 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none'
              }`}
            >
              {status === 'loading' ? (
                <>
                  <span className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                  <span>처리 중</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>전송</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-slate-600 px-1">
            <kbd className="font-mono bg-slate-800 border border-slate-700 px-1 rounded">Ctrl+Enter</kbd>로 빠르게 전송
          </p>
        </div>
      )}
    </div>
  );
};

export default RefinePromptBar;
