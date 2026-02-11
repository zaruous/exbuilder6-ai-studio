
export interface JavaFile {
  fileName: string;
  packagePath: string;
  content: string;
  type: 'controller' | 'service' | 'model';
}

export interface GenerationResult {
  clxCode: string;
  jsCode: string;
  javaFiles: JavaFile[];
  logs: string[];
  explanation: string;
  previewMock?: string;
}

export enum TabType {
  CLX = 'CLX',
  JS = 'JS',
  SERVER = 'SERVER',
  LOGS = 'LOGS',
  PREVIEW = 'PREVIEW'
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export type AIProvider = 'gemini' | 'openai' | 'ollama' | 'web-service';

export interface GenerationSettings {
  // AI Config
  provider: AIProvider;
  baseUrl?: string; // For OpenAI/Ollama/WebService
  modelName: string; // e.g., gemini-3-pro-preview, gpt-4o, llama3
  
  // Generation Params
  temperature: number;
  language: 'ko' | 'en';
  includeComments: boolean;
  basePackage: string;
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
