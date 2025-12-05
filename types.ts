
export interface DocumentState {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
}

export interface DocumentMetadata {
  id: string;
  title: string;
  lastModified: string;
  preview: string;
}

export enum RewriteMode {
  IMPROVE = 'improve',
  SHORTEN = 'shorten',
  EXPAND = 'expand',
  TONE_CASUAL = 'casual',
  TONE_PROFESSIONAL = 'professional',
  CUSTOM = 'custom'
}

export interface MagicCommand {
  mode: RewriteMode;
  customPrompt?: string;
}

export interface FileAttachment {
  name: string;
  mimeType: string;
  data: string; // Base64
}

export interface AiSuggestion {
  id: string;
  originalText: string;
  suggestedText: string;
  reason: string;
  startIndex: number;
  endIndex: number;
}

export type AiProvider = 'google' | 'openai' | 'deepseek' | 'kimi';

export interface AppSettings {
  provider: AiProvider;
  model: string;
  temperature: number;
  customApiKey?: string;
  customBaseUrl?: string;
}
