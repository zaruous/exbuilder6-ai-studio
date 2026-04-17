/**
 * Monaco는 기본적으로 CDN(jsDelivr)에서 로드됩니다. 사내망 등에서 CDN이 막히면
 * @monaco-editor/react가 "Loading..."에서 멈춥니다.
 * npm 패키지(monaco-editor)와 Vite worker 번들을 쓰도록 로더를 설정합니다.
 */
import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

function getWorker(_workerId: string, label: string): Worker {
  if (label === 'json') return new JsonWorker();
  if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
  if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker();
  if (label === 'typescript' || label === 'javascript') return new TsWorker();
  return new EditorWorker();
}

self.MonacoEnvironment = { getWorker };

loader.config({ monaco });
