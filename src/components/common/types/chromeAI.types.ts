/**
 * TypeScript definitions for Chrome Built-in AI API (2026)
 * @see https://developer.chrome.com/docs/ai/built-in
 */

declare global {
  interface Window {
    ai?: {
      languageModel?: LanguageModelAPI;
    };
  }
  
  const ai: {
    languageModel: LanguageModelAPI;
  } | undefined;

  const LanguageModel: LanguageModelAPI | undefined;
}

export interface LanguageModelAPI {
  availability: () => Promise<'available' | 'downloadable' | 'no'>;
  capabilities: () => Promise<{ available: 'readily' | 'after-download' | 'no' }>;
  create: (options?: AISessionOptions) => Promise<LanguageModelSession>;
}

export interface LanguageModelSession {
  prompt: (text: string) => Promise<string>;
  promptStreaming?: (text: string) => AsyncIterable<string>;
  destroy: () => void;
}

export interface AISessionOptions {
  systemPrompt?: string;
  temperature?: number;
  topK?: number;
}

export type AIModelStatus = 'checking' | 'ready' | 'downloading' | 'unavailable';

export {};
