import React, { useState } from 'react';
import { Send, ChevronDown, ChevronUp, Copy } from 'lucide-react';

interface RefinePromptBarProps {
  tabLabel: string;
  placeholder?: string;
  onApply: (prompt: string) => Promise<string>;
  onResponse?: (response: string, isError: boolean) => void;
  disabled?: boolean;
  defaultExpanded?: boolean;
}

const RefinePromptBar: React.FC<RefinePromptBarProps> = ({
  tabLabel,
  placeholder = '수정 요청을 입력하세요 (예: 검증 추가, 문법 수정, 쿼리 최적화...)',
  onApply,
  onResponse,
  disabled = false,
  defaultExpanded = false
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [response, setResponse] = useState<string | null>(null);

  const handleApply = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setResponse(null);
    try {
      const result = await onApply(trimmed);
      setResponse(result);
      setPrompt('');
      onResponse?.(result, false);
    } catch (err) {
      console.error('Refine failed:', err);
      const errMsg = `오류: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setResponse(errMsg);
      onResponse?.(errMsg, true);
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    if (response) navigator.clipboard.writeText(response);
  };

  return (
    <div className="shrink-0 border-t border-slate-800 bg-slate-900/80">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
      >
        <span>Refine / Edit {tabLabel}</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3">
          <div className="flex gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              rows={2}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none disabled:opacity-50"
            />
            <button
              onClick={handleApply}
              disabled={disabled || loading || !prompt.trim()}
              className="self-end px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium flex items-center gap-2 transition-all shrink-0"
            >
              {loading ? (
                <span className="animate-pulse">처리 중...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  전송
                </>
              )}
            </button>
          </div>
          {response !== null && (
            <div className="rounded-lg border border-slate-700 bg-slate-950 overflow-hidden">
              <div className="px-3 py-2 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">AI 응답</span>
                <button
                  onClick={copyResponse}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  복사
                </button>
              </div>
              <pre className="p-3 text-xs text-slate-300 whitespace-pre-wrap overflow-auto max-h-48 font-mono">
                {response}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RefinePromptBar;
