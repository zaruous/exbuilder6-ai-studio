/**
 * exportUtils.ts
 *
 * STANDARD 모드 (문서형)  → doStandardExport*
 * MARP 모드    (슬라이드형) → doMarpExport*
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import pptxgen from 'pptxgenjs';
// @ts-ignore
import { asBlob } from 'html-docx-js-typescript';
import { Marp } from '@marp-team/marp-core';
import { marked } from 'marked';

const marpInstance = new Marp({ html: true, inlineSVG: false });

// ─────────────────────────────────────────────────────────────────────────────
// 공통: 다운로드 트리거
// ─────────────────────────────────────────────────────────────────────────────

function triggerDownload(href: string, filename: string): void {
  const a = Object.assign(document.createElement('a'), { href, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

// ─────────────────────────────────────────────────────────────────────────────
// 공통: 폰트 패밀리
// ─────────────────────────────────────────────────────────────────────────────

const FONT_FAMILY =
  "'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR','Noto Sans','Helvetica Neue',Arial,sans-serif";

// ═════════════════════════════════════════════════════════════════════════════
//  STANDARD (문서형) 내보내기
// ═════════════════════════════════════════════════════════════════════════════

/** Marp front-matter를 제거하고 marked로 HTML 변환 */
function markdownToHtml(markdown: string): string {
  const cleaned = markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
  return marked.parse(cleaned, { gfm: true, breaks: true }) as string;
}

const STANDARD_DOC_CSS = `
  body {
    font-family: ${FONT_FAMILY};
    max-width: 900px;
    margin: 0 auto;
    padding: 48px 56px;
    color: #222;
    line-height: 1.8;
    background: #fff;
  }
  h1 { font-size: 26pt; border-bottom: 2px solid #eee; padding-bottom: 8pt; margin-top: 0; color: #1a1a1a; }
  h2 { font-size: 20pt; margin-top: 28pt; color: #1a1a1a; }
  h3 { font-size: 14pt; margin-top: 20pt; color: #1a1a1a; }
  p, li { font-size: 11pt; line-height: 1.8; color: #222; }
  table { border-collapse: collapse; width: 100%; margin: 16pt 0; }
  th, td { border: 1px solid #ddd; padding: 8pt 12pt; font-size: 10pt; color: #222; }
  th { background: #f5f5f5; font-weight: bold; }
  code { font-family: 'Courier New', monospace; font-size: 9pt; background: #f5f5f5; padding: 2px 6px; border-radius: 3px; color: #2d2d2d; }
  pre { background: #f5f5f5; padding: 12pt; border-radius: 6pt; overflow: auto; }
  pre code { background: none; padding: 0; }
  ul, ol { padding-left: 24pt; }
  li { margin-bottom: 4pt; }
  hr { border: none; border-top: 1px solid #eee; margin: 24pt 0; }
  img { max-width: 100%; }
`;

// ── Standard HTML ────────────────────────────────────────────────────────────

export function doStandardExportHTML(markdown: string): void {
  const htmlContent = markdownToHtml(markdown);
  const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Design Document</title>
  <style>${STANDARD_DOC_CSS}</style>
</head>
<body>${htmlContent}</body>
</html>`;

    
  triggerDownload(
    URL.createObjectURL(new Blob([fullHtml], { type: 'text/html;charset=utf-8' })),
    genFileName('design_document', 'html'),
  );
}

// ── Standard PDF ─────────────────────────────────────────────────────────────

export async function doStandardExportPDF(markdown: string): Promise<void> {
  const htmlContent = markdownToHtml(markdown);

  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    position: 'fixed',
    left: '-99999px',
    top: '0',
    width: '794px',
    background: '#ffffff',
    zIndex: '-1',
    pointerEvents: 'none',
  });
  wrapper.innerHTML = `<style>${STANDARD_DOC_CSS}</style><div style="padding:48px 56px">${htmlContent}</div>`;
  document.body.appendChild(wrapper);

  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 300));

  const canvas = await html2canvas(wrapper, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  document.body.removeChild(wrapper);

  // A4: 595.28 × 841.89 pt
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  const pageCanvasHeight = Math.floor((pageHeight / imgWidth) * canvas.width);
  const totalPages = Math.ceil(canvas.height / pageCanvasHeight);

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage();

    const sliceHeight = Math.min(pageCanvasHeight, canvas.height - page * pageCanvasHeight);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = pageCanvasHeight;

    const ctx = pageCanvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(
      canvas,
      0, page * pageCanvasHeight, canvas.width, sliceHeight,
      0, 0, canvas.width, sliceHeight,
    );

    pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageWidth, pageHeight);
  }

  pdf.save(genFileName('design_document', 'pdf'));
}

// ── Standard DOCX ────────────────────────────────────────────────────────────

export async function doStandardExportDOCX(markdown: string): Promise<void> {
  const htmlContent = markdownToHtml(markdown);

  const docHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body { font-family: ${FONT_FAMILY}; margin: 0; padding: 0; }
  h1 { font-size: 28pt; margin-bottom: 12pt; color: #1a1a1a; }
  h2 { font-size: 20pt; margin-bottom: 8pt; color: #1a1a1a; }
  h3 { font-size: 14pt; margin-bottom: 6pt; color: #1a1a1a; }
  p, li { font-size: 11pt; line-height: 1.7; color: #222; }
  table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
  th, td { border: 1px solid #ccc; padding: 5pt 8pt; font-size: 10pt; color: #222; }
  th { background: #f0f0f0; font-weight: bold; }
  code { font-family: 'Courier New', monospace; font-size: 9pt; background: #f5f5f5; padding: 1px 4px; border-radius: 2px; color: #2d2d2d; }
  pre { background: #f5f5f5; padding: 8pt; border-radius: 4pt; overflow: auto; }
</style>
</head><body><div style="padding:48pt 56pt">${htmlContent}</div></body></html>`;

  // @ts-ignore
  const blob = await asBlob(docHtml, {
    orientation: 'portrait',
    margins: { top: 720, right: 720, bottom: 720, left: 720 },
  });
  triggerDownload(URL.createObjectURL(blob as Blob), genFileName('design_document', 'docx'));
}

function genFileName(baseName: string, extension: string): string {
  //yyyymmddhhmmss 형식의 타임스탬프 생성
  return `${baseName}_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.${extension}`;
}

/**
 * 원본 Markdown 파일로 내보내기 
 * @param markdown 
 */
export async function doStandardExportMarkdown(markdown: string): Promise<void> {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    triggerDownload(URL.createObjectURL(blob),  genFileName('design_document', 'md'));
}

// ═════════════════════════════════════════════════════════════════════════════
//  MARP (슬라이드형) 내보내기
// ═════════════════════════════════════════════════════════════════════════════

/** Marp CSS에서 외부 폰트 @import를 제거하고 시스템 폰트 + CSS 변수 주입 */
function normalizeMarpCss(css: string): string {
  const stripped = css.replace(/@import\s+url\([^)]+\)[^;]*;/gi, '');

  return stripped + `
    section, section * {
      font-family: ${FONT_FAMILY} !important;
      --color: #222222;
      --heading-color: #1a1a1a;
      --text-color: #222222;
      --background: #ffffff;
      --highlight-color: #0066cc;
    }
    section {
      position: relative !important;
      top: 0 !important; left: 0 !important;
      transform: none !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      overflow: hidden !important;
      background-color: #ffffff !important;
      box-sizing: border-box !important;
    }
    section h1, section h2, section h3,
    section h4, section h5, section h6 {
      color: var(--heading-color, #1a1a1a) !important;
    }
    section p, section li, section td, section th, section span {
      color: var(--text-color, #222222) !important;
    }
    section code, section pre {
      color: #2d2d2d !important;
      background-color: #f4f4f4 !important;
    }
    section a { color: var(--highlight-color, #0066cc) !important; }
  `;
}

/** 숨겨진 컨테이너에 슬라이드를 렌더 → html2canvas 캡처 → base64 dataURL */
async function captureSlideAsImage(
  sectionHtml: string,
  rawMarpCss: string,
  width = 1280,
  height = 720,
): Promise<string> {
  const normalizedCss = normalizeMarpCss(rawMarpCss);

  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    position: 'fixed',
    left: '-99999px',
    top: '0',
    width: `${width}px`,
    height: `${height}px`,
    overflow: 'visible',
    background: '#ffffff',
    zIndex: '-1',
    pointerEvents: 'none',
  });

  wrapper.innerHTML = `<style>${normalizedCss}</style>${sectionHtml}`;
  document.body.appendChild(wrapper);

  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 250));

  const sectionEl = wrapper.querySelector('section') as HTMLElement;
  if (sectionEl) {
    Object.assign(sectionEl.style, {
      width: `${width}px`,
      height: `${height}px`,
      position: 'relative',
      top: '0',
      left: '0',
      transform: 'none',
    });
  }

  const canvas = await html2canvas(sectionEl ?? wrapper, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width,
    height,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
    logging: false,
    onclone: (_doc, clonedEl) => {
      const s = clonedEl.tagName === 'SECTION'
        ? clonedEl
        : clonedEl.querySelector('section');
      if (s) {
        Object.assign((s as HTMLElement).style, {
          width: `${width}px`,
          height: `${height}px`,
          position: 'relative',
          top: '0',
          left: '0',
          transform: 'none',
          fontFamily: FONT_FAMILY,
        });
      }
    },
  });

  document.body.removeChild(wrapper);
  return canvas.toDataURL('image/jpeg', 0.95);
}

/** Marp 마크다운에서 section별 HTML 배열 추출 */
function extractSections(markdown: string): { sections: string[]; css: string } {
  const { html, css } = marpInstance.render(markdown);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const sections = Array.from(doc.querySelectorAll('section')).map(s => s.outerHTML);
  return { sections, css };
}

// ── Marp PDF ─────────────────────────────────────────────────────────────────

export async function doMarpExportPDF(markdown: string): Promise<void> {
  const { sections, css } = extractSections(markdown);
  if (sections.length === 0) throw new Error('슬라이드가 없습니다.');

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1280, 720] });

  for (let i = 0; i < sections.length; i++) {
    const dataUrl = await captureSlideAsImage(sections[i], css);
    if (i > 0) pdf.addPage([1280, 720], 'landscape');
    pdf.addImage(dataUrl, 'JPEG', 0, 0, 1280, 720);
  }

  
  pdf.save(genFileName('design_document', 'pdf'));
}

// ── Marp PPTX ────────────────────────────────────────────────────────────────

export async function doMarpExportPPTX(markdown: string): Promise<void> {
  const { sections, css } = extractSections(markdown);
  if (sections.length === 0) throw new Error('슬라이드가 없습니다.');

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';

  for (const sectionHtml of sections) {
    const dataUrl = await captureSlideAsImage(sectionHtml, css);
    const slide = pres.addSlide();
    slide.addImage({ data: dataUrl, x: 0, y: 0, w: '100%', h: '100%' });
  }

  
  await pres.writeFile({ fileName: genFileName('design_document', 'pptx') });
}

// ── Marp HTML ────────────────────────────────────────────────────────────────

export function doMarpExportHTML(markdown: string): void {
  const { html, css } = marpInstance.render(markdown);
  const normalizedCss = normalizeMarpCss(css);

  const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Design Document</title>
  <style>
    ${normalizedCss}
    html, body { margin: 0; padding: 0; background: #0f172a; }
    section {
      width: 1280px;
      height: 720px;
      margin: 32px auto;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5);
    }
  </style>
</head>
<body>${html}</body>
</html>`;

  triggerDownload(
    URL.createObjectURL(new Blob([fullHtml], { type: 'text/html;charset=utf-8' })),
    genFileName('design_document', 'html')
  );
}

// ── Marp DOCX ────────────────────────────────────────────────────────────────

export async function doMarpExportDOCX(markdown: string): Promise<void> {
  const { html, css } = marpInstance.render(markdown);
  const normalizedCss = normalizeMarpCss(css);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const sections = Array.from(doc.querySelectorAll('section'));

  const body = sections
    .map((s, i) => {
      const isLast = i === sections.length - 1;
      return `<div style="page-break-after:${isLast ? 'avoid' : 'always'};padding:48pt 56pt">${s.innerHTML}</div>`;
    })
    .join('');

  const docHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  ${normalizedCss}
  body { font-family: ${FONT_FAMILY}; margin: 0; padding: 0; }
  h1 { font-size: 28pt; margin-bottom: 12pt; color: #1a1a1a; }
  h2 { font-size: 20pt; margin-bottom: 8pt; color: #1a1a1a; }
  h3 { font-size: 14pt; margin-bottom: 6pt; color: #1a1a1a; }
  p, li { font-size: 11pt; line-height: 1.7; color: #222; }
  table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
  th, td { border: 1px solid #ccc; padding: 5pt 8pt; font-size: 10pt; color: #222; }
  th { background: #f0f0f0; font-weight: bold; }
  code { font-family: 'Courier New', monospace; font-size: 9pt; background: #f5f5f5; padding: 1px 4px; border-radius: 2px; color: #2d2d2d; }
</style>
</head><body>${body}</body></html>`;

  // @ts-ignore
  const blob = await asBlob(docHtml, {
    orientation: 'landscape',
    margins: { top: 720, right: 720, bottom: 720, left: 720 },
  });
  
  triggerDownload(URL.createObjectURL(blob as Blob), genFileName('design_document', 'docx'));
}
