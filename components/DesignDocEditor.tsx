import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  FileText, Presentation, Download, Maximize2, X, FileCode, FileDown, Layout,
  Split, Eye, Edit3, ChevronLeft, ChevronRight
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
// @ts-ignore
import { asBlob } from 'html-docx-js-typescript';
import pptxgen from "pptxgenjs";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface ParsedSlide { content: string; index: number; }
type ViewType = 'standard' | 'marp';
type LayoutType = 'split' | 'edit' | 'preview';

interface DesignDocEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
/** '---' 기준으로 슬라이드 분리 (앞뒤 공백 무시) */
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
  onExport: (type: 'html' | 'pdf' | 'docx' | 'pptx') => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  if (!isOpen) return null;
  const formats = [
    { id: 'html'  as const, label: 'HTML',              icon: FileCode,    color: 'text-blue-400',   desc: 'Web standard format' },
    { id: 'pdf'   as const, label: 'PDF Document',      icon: FileDown,    color: 'text-red-400',    desc: 'Professional printable document' },
    { id: 'docx'  as const, label: 'Word (DOCX)',       icon: FileText,    color: 'text-blue-500',   desc: 'Editable Microsoft Word document' },
    { id: 'pptx'  as const, label: 'PowerPoint (PPTX)',icon: Presentation,color: 'text-orange-500', desc: 'Microsoft PowerPoint presentation' },
  ];
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-500" /> Export Document
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 gap-3">
          {formats.map(f => (
            <button key={f.id} onClick={() => { onExport(f.id); onClose(); }}
              className="flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-xl transition-all group text-left">
              <div className={`p-3 bg-slate-900 rounded-lg group-hover:scale-110 transition-transform ${f.color}`}>
                <f.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-200">{f.label}</div>
                <div className="text-[10px] text-slate-500">{f.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// SlideCard  –  single slide rendered as 16:9 card
// ──────────────────────────────────────────────
const SLIDE_THEMES = [
  { bg: 'bg-white',          text: 'prose-slate',    accent: 'border-blue-500'   },
  { bg: 'bg-slate-900',      text: 'prose-invert',   accent: 'border-emerald-500'},
  { bg: 'bg-blue-950',       text: 'prose-invert',   accent: 'border-cyan-400'   },
  { bg: 'bg-amber-50',       text: 'prose-stone',    accent: 'border-amber-500'  },
];

const SlideCard: React.FC<{ slide: ParsedSlide; total: number }> = ({ slide, total }) => {
  const theme = SLIDE_THEMES[slide.index % SLIDE_THEMES.length];
  const isFirstSlide = slide.index === 0;

  return (
    <div
      className={`relative rounded-xl shadow-2xl overflow-hidden border-t-4 ${theme.accent} ${theme.bg}`}
      style={{ width: '100%', maxWidth: '854px', aspectRatio: '16/9', flexShrink: 0 }}
    >
      {/* slide number */}
      <span className="absolute top-3 right-4 text-[10px] font-mono text-slate-400 z-10">
        {slide.index + 1} / {total}
      </span>

      {/* content */}
      <div className={`w-full h-full overflow-hidden flex flex-col justify-center
        ${isFirstSlide ? 'px-16 py-12' : 'px-12 py-10'}
        prose ${theme.text} max-w-none
        prose-h1:text-4xl prose-h1:font-black prose-h1:leading-tight prose-h1:mb-3
        prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-2
        prose-h3:text-xl prose-h3:font-semibold
        prose-p:text-base prose-p:leading-relaxed
        prose-li:text-base prose-li:leading-relaxed
        prose-table:text-sm
        prose-code:text-xs
      `}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {slide.content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Main editor
// ──────────────────────────────────────────────
const DesignDocEditor: React.FC<DesignDocEditorProps> = ({
  initialContent = '# 화면 설계서\n\n## 개요\n이 화면은 ... 을 위한 화면입니다.\n\n## 주요 기능\n- 기능 1\n- 기능 2\n\n---\n\n## 화면 레이아웃\n| 영역 | 설명 |\n| --- | --- |\n| 헤더 | 시스템 로고 및 사용자 정보 |\n| 사이드바 | 메뉴 네비게이션 |\n| 메인 | 데이터 그리드 및 상세 정보 |\n\n---\n\n## 기능 상세\n- 상세 기능 A\n- 상세 기능 B\n- 상세 기능 C',
  onSave,
}) => {
  const [content, setContent]               = useState(initialContent || '');
  const [viewType, setViewType]             = useState<ViewType>('standard');
  const [layout, setLayout]                 = useState<LayoutType>('split');
  const [isPreviewOpen, setIsPreviewOpen]   = useState(false);
  const [isExportOpen, setIsExportOpen]     = useState(false);
  const [currentSlide, setCurrentSlide]     = useState(0);
  const [slides, setSlides]                 = useState<ParsedSlide[]>([]);
  const previewRef                          = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialContent != null) setContent(initialContent);
  }, [initialContent]);

  // ── parse slides whenever content or viewType changes
  useEffect(() => {
    if (viewType === 'marp') {
      const parsed = parseSlides(content);
      setSlides(parsed);
      setCurrentSlide(0);
    }
  }, [content, viewType]);

  // ── keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (viewType !== 'marp') return;
      if (e.key === 'ArrowRight' || e.key === ' ') setCurrentSlide(p => Math.min(p + 1, slides.length - 1));
      if (e.key === 'ArrowLeft')                    setCurrentSlide(p => Math.max(p - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewType, slides.length]);

  // ── export helpers
  const getExportHTML = () => {
    const body = previewRef.current?.innerHTML || '';
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>body{font-family:sans-serif;padding:40px}
      table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}th{background:#f2f2f2}
      h1{font-size:2em;border-bottom:1px solid #eee;padding-bottom:.3em}
      h2{font-size:1.5em;border-bottom:1px solid #eee;padding-bottom:.3em}
      ul{list-style:disc;margin-left:20px}</style></head>
      <body>${body}</body></html>`;
  };

  const handleExport = async (type: 'html' | 'pdf' | 'docx' | 'pptx') => {
    if (type === 'html') {
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(new Blob([getExportHTML()], { type: 'text/html' })),
        download: 'design_document.html',
      });
      a.click();
    }
    if (type === 'pdf') {
      const el = previewRef.current;
      if (el) html2pdf().set({ margin:10, filename:'design_document.pdf',
        image:{type:'jpeg',quality:.98}, html2canvas:{scale:2},
        jsPDF:{unit:'mm',format:'a4',orientation:'portrait'} }).from(el).save();
    }
    if (type === 'docx') {
      // @ts-ignore
      const blob = await asBlob(getExportHTML());
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob as Blob), download: 'design_document.docx',
      });
      a.click();
    }
    if (type === 'pptx') {
      const pres = new pptxgen();
      pres.layout = 'LAYOUT_16x9';
      (slides.length ? slides : [{ content, index: 0 }]).forEach(slide => {
        const s  = pres.addSlide();
        const parser = new DOMParser();
        const doc  = parser.parseFromString(
          `<div>${slide.content}</div>`, 'text/html');
        const title = doc.querySelector('h1,h2')?.textContent || '';
        const items = Array.from(doc.querySelectorAll('li')).map(l => l.textContent || '');
        const paras = Array.from(doc.querySelectorAll('p')).map(p => p.textContent || '');
        if (title) s.addText(title, { x:.5,y:.5,w:'90%',h:1,fontSize:24,bold:true,color:'363636' });
        let y = 1.5;
        paras.filter(p => p !== title).forEach(p => {
          s.addText(p, { x:.5,y,w:'90%',h:.5,fontSize:14,color:'666666' }); y += .6;
        });
        items.forEach(item => {
          s.addText(item, { x:.8,y,w:'85%',h:.4,fontSize:12,bullet:true,color:'444444' }); y += .5;
        });
      });
      pres.writeFile({ fileName: 'design_document.pptx' });
    }
  };

  // ── slide renderer
  const renderSlides = () => (
    <div className="w-full flex flex-col gap-8 pb-20 items-center">
      {slides.length === 0
        ? <p className="text-slate-500 text-sm mt-10">슬라이드가 없습니다. <code>---</code> 구분자로 슬라이드를 나눠보세요.</p>
        : slides.map(s => <SlideCard key={s.index} slide={s} total={slides.length} />)
      }
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-slate-300 uppercase">Design Document Editor</span>
          </div>
          <div className="h-4 w-px bg-slate-800" />

          {/* View mode */}
          <div className="flex bg-slate-800 p-1 rounded-lg gap-1">
            {(['standard','marp'] as ViewType[]).map(v => (
              <button key={v} onClick={() => setViewType(v)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-all
                  ${viewType===v
                    ? v==='standard' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'}`}>
                {v==='standard' ? <><Layout className="w-3 h-3"/>STANDARD</> : <><Presentation className="w-3 h-3"/>MARP (SLIDES)</>}
              </button>
            ))}
          </div>

          {/* Layout mode */}
          <div className="flex bg-slate-800 p-1 rounded-lg gap-1">
            {([['split',Split,'Split'],['edit',Edit3,'Editor Only'],['preview',Eye,'Preview Only']] as const).map(([l,Icon,title]) => (
              <button key={l} onClick={() => setLayout(l)} title={title}
                className={`p-1.5 rounded-md transition-all ${layout===l ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-700 transition-all">
            <Maximize2 className="w-3 h-3" /> FULL PREVIEW
          </button>
          <button onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg shadow-lg shadow-blue-500/10 transition-all">
            <Download className="w-3 h-3" /> EXPORT
          </button>
        </div>
      </div>

      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} onExport={handleExport} />

      {/* ── Editor + Preview ── */}
      <div className="flex-1 flex overflow-hidden bg-slate-950/50">
        {(layout === 'split' || layout === 'edit') && (
          <div className={`${layout==='split' ? 'w-1/2' : 'w-full'} border-r border-slate-800`}>
            <Editor height="100%" defaultLanguage="markdown" value={content}
              onChange={v => setContent(v||'')} theme="vs-dark"
              options={{ minimap:{enabled:false}, fontSize:14, lineNumbers:'on',
                scrollBeyondLastLine:false, automaticLayout:true, padding:{top:20,bottom:20},
                fontFamily:"'Fira Code', monospace", wordWrap:'on' }} />
          </div>
        )}

        {(layout === 'split' || layout === 'preview') && (
          <div className={`${layout==='split' ? 'w-1/2' : 'w-full'} flex flex-col overflow-hidden
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

      {/* ── Footer ── */}
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

      {/* ── Full Screen Preview ── */}
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
};

export default DesignDocEditor;