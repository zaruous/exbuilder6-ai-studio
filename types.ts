
export interface JavaFile {
  fileName: string;
  packagePath: string;
  content: string;
  type: 'controller' | 'service' | 'model';
}

export interface GenerationResult {
  clxCode?: string;
  jsCode?: string;
  sqlCode?: string;
  javaFiles?: JavaFile[];
  designDoc?: string;
  logs: string[];
  explanation: string;
  previewMock?: string;
}

export type GenerationStage = 'sql' | 'server' | 'layout' | 'script' | 'design';

export enum TabType {
  CLX = 'CLX',
  JS = 'JS',
  SQL = 'SQL',
  SERVER = 'SERVER',
  LOGS = 'LOGS',
  PREVIEW = 'PREVIEW',
  DESIGN_DOC = 'DESIGN_DOC'
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export type AIProvider = 'gemini' | 'openai' | 'ollama' | 'web-service';

export interface ProviderConfig {
  modelName: string;
  baseUrl?: string;
}

export interface GenerationSettings {
  // AI Config
  provider: AIProvider;
  providerConfigs: Record<AIProvider, ProviderConfig>;
  
  // Generation Params
  temperature: number;
  language: 'ko' | 'en';
  includeComments: boolean;
  basePackage: string;
  dbms: 'postgre' | 'mssql' | 'oracle';
}

// Community Features
export interface Comment {
  id: string;
  author: string;
  content: string;
  rating: number; // 1-5
  createdAt: string;
}

export interface SharedComponent {
  id: string;
  title: string;
  description: string;
  author: string;
  generationResult: GenerationResult; // The code payload
  comments: Comment[];
  likes: number;
  createdAt: string;
  tags: string[];
}
