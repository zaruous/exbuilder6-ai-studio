import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FileText, Presentation, Download, Maximize2, Minimize2, X, FileCode, FileDown, Layout,
  Split, Eye, Edit3, Loader2
} from 'lucide-react';
import { Marp } from '@marp-team/marp-core';
import {
  doStandardExportHTML, doStandardExportPDF, doStandardExportDOCX,
  doMarpExportHTML, doMarpExportPDF, doMarpExportDOCX, doMarpExportPPTX,
  doStandardExportMarkdown
} from './exportUtils';
import RefinePromptBar from './RefinePromptBar';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface ParsedSlide { content: string; index: number; html?: string; }
type ViewType = 'standard' | 'marp';
type LayoutType = 'split' | 'edit' | 'preview';

interface DesignDocEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  onRefine?: (instruction: string, currentContent: string) => Promise<string>;
}

// Twemoji 기본은 cdn.jsdelivr.net 이미지 URL — 사내망 차단 시 깨짐. :shortcode:는 유니코드로만 변환.
const marpInstance = new Marp({
  html: true,
  inlineSVG: false,
  emoji: {
    shortcode: true,
    unicode: false,
  },
  script: { source: 'inline' },
});

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const parseSlides = (markdown: string): ParsedSlide[] =>
  markdown
    .split(/\n\s*---\s*\n/)
    .map((c, i) => ({ content: c.trim(), index: i }))
    .filter(s => s.content.length > 0);

// ──────────────────────────────────────────────
// ExportModal
// ──────────────────────────────────────────────
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: 'html' | 'pdf' | 'docx' | 'pptx' | 'md') => void;
  exporting: boolean;
  viewType: ViewType;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, exporting, viewType }) => {
  if (!isOpen) return null;

  const marpFormats = [
    { id: 'html'  as const, label: 'HTML (슬라이드)',       icon: FileCode,     color: 'text-blue-400',   desc: '슬라이드 형태의 웹 파일' },
    { id: 'pdf'   as const, label: 'PDF (슬라이드)',        icon: FileDown,     color: 'text-red-400',    desc: '슬라이드별 캡처한 고품질 PDF' },
    { id: 'docx'  as const, label: 'Word (DOCX)',          icon: FileText,     color: 'text-blue-500',   desc: '슬라이드 기반 Word 문서' },
    { id: 'pptx'  as const, label: 'PowerPoint (PPTX)',    icon: Presentation, color: 'text-orange-500', desc: '슬라이드별 캡처한 프레젠테이션' },
    { id: 'md'    as const, label: 'Markdown',             icon: FileCode,     color: 'text-gray-400',   desc: '원본 Markdown 파일' },
  ];

  const standardFormats = [
    { id: 'html'  as const, label: 'HTML',                 icon: FileCode,     color: 'text-blue-400',   desc: '웹 브라우저에서 바로 볼 수 있는 문서' },
    { id: 'pdf'   as const, label: 'PDF Document',         icon: FileDown,     color: 'text-red-400',    desc: 'A4 세로 문서형 고품질 PDF' },
    { id: 'docx'  as const, label: 'Word (DOCX)',          icon: FileText,     color: 'text-blue-500',   desc: 'Microsoft Word 문서' },
    { id: 'md'    as const, label: 'Markdown',             icon: FileCode,     color: 'text-gray-400',   desc: '원본 Markdown 파일' },
  ];

  const formats = viewType === 'marp' ? marpFormats : standardFormats;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-500" /> Export Document
          </h3>
          {!exporting && (
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="p-6 grid grid-cols-1 gap-3">
          {exporting ? (
            <div className="flex flex-col items-center gap-3 py-8 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <span className="text-sm">
                {viewType === 'marp' ? '슬라이드 캡처 중... 잠시 기다려 주세요' : '문서 변환 중... 잠시 기다려 주세요'}
              </span>
            </div>
          ) : (
            formats.map(f => (
              <button key={f.id}
                onClick={() => { onExport(f.id); }}
                className="flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-xl transition-all group text-left">
                <div className={`p-3 bg-slate-900 rounded-lg group-hover:scale-110 transition-transform ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-200">{f.label}</div>
                  <div className="text-[10px] text-slate-500">{f.desc}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// SlideCard
// ──────────────────────────────────────────────
const SLIDE_THEMES = [
  { bg: 'bg-white',     text: 'prose-slate',  accent: 'border-blue-500'    },
  { bg: 'bg-slate-900', text: 'prose-invert', accent: 'border-emerald-500' },
  { bg: 'bg-blue-950',  text: 'prose-invert', accent: 'border-cyan-400'    },
  { bg: 'bg-amber-50',  text: 'prose-stone',  accent: 'border-amber-500'   },
];

/** Marp default 테마: section { width:1280px; height:720px; font-size:29px; padding:78.5px } */
const MARP_SLIDE_W = 1280;
const MARP_SLIDE_H = 720;
const MARP_ASPECT  = MARP_SLIDE_H / MARP_SLIDE_W; // 0.5625

const MarpSlideCard: React.FC<{ slide: ParsedSlide; total: number; accentClass: string }> = ({ slide, total, accentClass }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardW, setCardW] = useState(0);

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setCardW(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = cardW > 0 ? cardW / MARP_SLIDE_W : 0;
  const visibleH = cardW > 0 ? cardW * MARP_ASPECT : 0;

  return (
    <div
      ref={cardRef}
      className={`relative rounded-xl shadow-2xl border-t-4 shrink-0 ${accentClass} bg-slate-950`}
      style={{ width: '100%', maxWidth: 854 }}
    >
      <span className="absolute top-3 right-4 text-[10px] font-mono text-slate-300 z-20 pointer-events-none drop-shadow">
        {slide.index + 1} / {total}
      </span>
      <div className="overflow-hidden" style={{ height: visibleH || 'auto' }}>
        <div
          style={{
            width: MARP_SLIDE_W,
            height: MARP_SLIDE_H,
            transform: scale > 0 ? `scale(${scale})` : 'scale(0.5)',
            transformOrigin: 'top left',
          }}
        >
          <div className="marpit" dangerouslySetInnerHTML={{ __html: slide.html! }} />
        </div>
      </div>
    </div>
  );
};

const SlideCard: React.FC<{ slide: ParsedSlide; total: number }> = ({ slide, total }) => {
  const theme = SLIDE_THEMES[slide.index % SLIDE_THEMES.length];

  if (slide.html) {
    return <MarpSlideCard slide={slide} total={total} accentClass={theme.accent} />;
  }

  return (
    <div
      className={`relative rounded-xl shadow-2xl overflow-hidden border-t-4 ${theme.accent} ${theme.bg}`}
      style={{ width: '100%', maxWidth: 854, aspectRatio: '16/9', flexShrink: 0 }}
    >
      <span className="absolute top-3 right-4 text-[10px] font-mono text-slate-400 z-10">
        {slide.index + 1} / {total}
      </span>
      <div className={`w-full h-full overflow-auto flex flex-col justify-center
        prose ${theme.text} max-w-none
        prose-h1:text-4xl prose-h1:font-black prose-h1:leading-tight prose-h1:mb-3
        prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-2
        prose-h3:text-xl prose-h3:font-semibold
        prose-p:text-base prose-p:leading-relaxed
        prose-li:text-base prose-li:leading-relaxed
        prose-table:text-sm prose-code:text-xs`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{slide.content}</ReactMarkdown>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Main Editor
// ──────────────────────────────────────────────
const DesignDocEditor: React.FC<DesignDocEditorProps> = ({
  onRefine,
  initialContent = `---
marp: true
theme: default
---

# 화면 설계서

## 개요
이 화면은 ... 을 위한 화면입니다.

---

## 주요 기능
- 기능 1
- 기능 2

---

## 화면 레이아웃
| 영역 | 설명 |
| --- | --- |
| 헤더 | 시스템 로고 및 사용자 정보 |
| 사이드바 | 메뉴 네비게이션 |
| 메인 | 데이터 그리드 및 상세 정보 |

---

## 기능 상세
- 상세 기능 A
- 상세 기능 B
- 상세 기능 C`,
  onSave,
}) => {
  const [content, setContent]             = useState(initialContent || '');
  const [viewType, setViewType]           = useState<ViewType>('standard');
  const [layout, setLayout]               = useState<LayoutType>('split');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExportOpen, setIsExportOpen]   = useState(false);
  const [isMaximized, setIsMaximized]     = useState(false);
  const [exporting, setExporting]         = useState(false);
  const [slides, setSlides]               = useState<ParsedSlide[]>([]);
  const [marpCss, setMarpCss]             = useState('');
  const previewRef                        = useRef<HTMLDivElement>(null);
  const monacoEditorRef                   = useRef<any>(null);

  // Monaco DOM에 캡처 단계 드롭 리스너 부착
  // capture:true → Monaco 내부 핸들러보다 먼저 실행되어 이벤트 가로챔
  const handleEditorMount = (editor: any) => {
    monacoEditorRef.current = editor;
    const domNode: HTMLElement | null = editor.getDomNode();
    if (!domNode) return;

    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer?.files ?? []);
      if (!files.length) return;

      const supported = files.filter(f =>
        /\.(md|txt|markdown)$/i.test(f.name) || f.type.startsWith('text/')
      );
      if (!supported.length) {
        alert('지원 형식: .md · .txt · .markdown');
        return;
      }

      Promise.all(supported.map(f => f.text())).then(texts => {
        const joined = texts.join('\n\n---\n\n');
        const newContent = joined;
        editor.setValue(newContent);
        setContent(newContent);
      });
    };

    domNode.addEventListener('dragover', onDragOver, true);
    domNode.addEventListener('drop', onDrop, true);
  };

  useEffect(() => {
    if (initialContent != null) setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    if (viewType === 'marp') {
      try {
        const { html, css } = marpInstance.render(content);
        setMarpCss(css);
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const marpit = doc.querySelector('div.marpit');
        const sectionEls = marpit
          ? Array.from(marpit.querySelectorAll(':scope > section'))
          : Array.from(doc.querySelectorAll('section'));
        const parsed: ParsedSlide[] = sectionEls.map((s, i) => ({
          content: s.textContent ?? '',
          html: s.outerHTML,
          index: i,
        }));
        setSlides(parsed.length > 0 ? parsed : parseSlides(content));
      } catch {
        setSlides(parseSlides(content));
      }
    } else {
      setSlides(parseSlides(content));
    }
  }, [content, viewType]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (viewType !== 'marp') return;
      if (e.key === 'ArrowRight' || e.key === ' ')
        setSlides(prev => { /* 키보드 탐색은 currentSlide로 분리 필요 시 추가 */ return prev; });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewType]);

  // ── Export handler ──────────────────────────────────────────────────────────
  const handleExport = async (type: 'html' | 'pdf' | 'docx' | 'pptx' | 'md') => {
    setExporting(true);
    try {
      if (viewType === 'marp') {
        switch (type) {
          case 'html': doMarpExportHTML(content); break;
          case 'pdf':  await doMarpExportPDF(content); break;
          case 'docx': await doMarpExportDOCX(content); break;
          case 'pptx': await doMarpExportPPTX(content); break;
          case 'md' :   await doStandardExportMarkdown(content); break;
        }
      } else {
        switch (type) {
          case 'html': doStandardExportHTML(content); break;
          case 'pdf':  await doStandardExportPDF(content); break;
          case 'docx': await doStandardExportDOCX(content); break;
          case 'md' :   await doStandardExportMarkdown(content); break;
      }
    }
    setIsExportOpen(false);
    } catch (err) {
      console.error(`Export (${type}) 실패:`, err);
      alert(`내보내기 실패: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExporting(false);
    }
  };

  // ── Slide renderer ──────────────────────────────────────────────────────────
  const renderSlides = () => (
    <div className="w-full flex flex-col gap-8 pb-20 items-center">
      <style dangerouslySetInnerHTML={{ __html: marpCss }} />
      {slides.length === 0
        ? <p className="text-slate-500 text-sm mt-10">슬라이드가 없습니다. <code>---</code> 구분자로 슬라이드를 나눠보세요.</p>
        : slides.map(s => <SlideCard key={s.index} slide={s} total={slides.length} />)}
    </div>
  );

  const editorBody = (
    <div className={`flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden ${
      isMaximized ? 'fixed inset-0 z-[200] rounded-none border-0' : 'h-full'
    }`}>

      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-slate-300 uppercase">Design Document Editor</span>
          </div>
          <div className="h-4 w-px bg-slate-800" />

          {/* View mode */}
          <div className="flex bg-slate-800 p-1 rounded-lg gap-1">
            {(['standard', 'marp'] as ViewType[]).map(v => (
              <button key={v} onClick={() => setViewType(v)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-all
                  ${viewType === v
                    ? v === 'standard' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'}`}>
                {v === 'standard'
                  ? <><Layout className="w-3 h-3" />STANDARD</>
                  : <><Presentation className="w-3 h-3" />MARP (SLIDES)</>}
              </button>
            ))}
          </div>

          {/* Layout mode */}
          <div className="flex bg-slate-800 p-1 rounded-lg gap-1">
            {([['split', Split, 'Split'], ['edit', Edit3, 'Editor Only'], ['preview', Eye, 'Preview Only']] as const).map(([l, Icon, title]) => (
              <button key={l} onClick={() => setLayout(l)} title={title}
                className={`p-1.5 rounded-md transition-all ${layout === l ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIsMaximized(v => !v)}
            title={isMaximized ? '축소' : '최대화'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-700 transition-all">
            {isMaximized
              ? <><Minimize2 className="w-3 h-3" /> MINIMIZE</>
              : <><Maximize2 className="w-3 h-3" /> MAXIMIZE</>}
          </button>
          <button onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-700 transition-all">
            <Eye className="w-3 h-3" /> FULL PREVIEW
          </button>
          <button onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg shadow-lg shadow-blue-500/10 transition-all">
            <Download className="w-3 h-3" /> EXPORT
          </button>
        </div>
      </div>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => !exporting && setIsExportOpen(false)}
        onExport={handleExport}
        exporting={exporting}
        viewType={viewType}
      />

      {/* Editor + Preview */}
      <div className="flex-1 flex overflow-hidden bg-slate-950/50">
        {(layout === 'split' || layout === 'edit') && (
          <div className={`${layout === 'split' ? 'w-1/2' : 'w-full'} border-r border-slate-800`}>
            <Editor height="100%" defaultLanguage="markdown" value={content}
              onMount={handleEditorMount}
              onChange={v => setContent(v || '')} theme="vs-dark"
              options={{
                minimap: { enabled: false }, fontSize: 14, lineNumbers: 'on',
                scrollBeyondLastLine: false, automaticLayout: true,
                padding: { top: 20, bottom: 20 },
                fontFamily: "'Fira Code', monospace", wordWrap: 'on',
              }} />
          </div>
        )}

        {(layout === 'split' || layout === 'preview') && (
          <div className={`${layout === 'split' ? 'w-1/2' : 'w-full'} flex flex-col overflow-hidden
            bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]`}>
            <div className="flex-1 overflow-auto p-8" ref={previewRef}>
              <div className="max-w-4xl mx-auto">
                {viewType === 'standard' ? (
                  <div className="prose prose-invert prose-slate max-w-none
                    prose-headings:text-slate-100 prose-p:text-slate-300 prose-strong:text-white
                    prose-li:text-slate-300 prose-table:border prose-table:border-slate-800
                    prose-th:bg-slate-900 prose-th:p-2 prose-td:p-2 prose-td:border-t prose-td:border-slate-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  </div>
                ) : renderSlides()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-slate-500 font-mono">
            CHARS: {content.length} | LINES: {content.split('\n').length}
          </span>
          {viewType === 'marp' && slides.length > 0 && (
            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
              SLIDES: {slides.length}
            </span>
          )}
        </div>
        {onSave && (
          <button onClick={() => onSave(content)} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors">
            SAVE CHANGES
          </button>
        )}
      </div>

      {/* AI Refine Bar */}
      {onRefine && (
        <RefinePromptBar
          tabLabel="Design Doc"
          defaultExpanded={false}
          onApply={async (instruction) => {
            const refined = await onRefine(instruction, content);
            setContent(refined);
            return refined;
          }}
        />
      )}

      {/* Full Screen Preview */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" /> Document Preview
            </h2>
            <button onClick={() => setIsPreviewOpen(false)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-12 bg-slate-900 flex items-start justify-center">
            <div className="w-full max-w-6xl">
              {viewType === 'standard' ? (
                <div className="bg-white p-16 border border-slate-100 min-h-screen prose prose-slate max-w-none rounded-xl">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </div>
              ) : renderSlides()}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return editorBody;
};

export default DesignDocEditor;