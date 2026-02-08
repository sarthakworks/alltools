import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { LanguageModelSession, AISessionOptions } from './types/chromeAI.types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a Chrome AI language model session with tiered priority fallback
 * 
 * @param options - Configuration options for the AI session
 * @returns Promise resolving to a LanguageModelSession
 * @throws Error if AI API is not available in the browser
 * 
 * @example
 * const session = await createAISession({
 *   systemPrompt: 'You are a helpful assistant'
 * });
 */
export async function createAISession(options?: AISessionOptions): Promise<LanguageModelSession> {
  // Try different global AI objects in priority order
  if (typeof ai !== 'undefined' && ai.languageModel) {
    return await ai.languageModel.create(options);
  }
  
  if (typeof LanguageModel !== 'undefined') {
    return await LanguageModel.create(options);
  }
  
  if (window.ai?.languageModel) {
    return await window.ai.languageModel.create(options);
  }
  
  throw new Error('Chrome AI API not found in this browser.');
}

/**
 * Streams AI response with fallback to regular prompt
 * 
 * @param session - Active AI session
 * @param prompt - Text prompt to send to the AI
 * @param onChunk - Callback function called for each chunk of streamed text
 * @returns Promise resolving to the complete response text
 * 
 * @example
 * const response = await streamAIResponse(
 *   session,
 *   'Write a story',
 *   (chunk) => setOutput(prev => prev + chunk)
 * );
 */
export async function streamAIResponse(
  session: LanguageModelSession,
  prompt: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  // Use streaming if available
  if (session.promptStreaming) {
    const stream = session.promptStreaming(prompt);
    let accumulated = '';
    
    for await (const chunk of stream) {
      accumulated += chunk;
      onChunk?.(chunk);
    }
    
    return accumulated;
  }
  
  // Fallback to regular prompt
  const response = await session.prompt(prompt);
  onChunk?.(response);
  return response;
}

/**
 * Creates a debounced version of a function that delays execution until after
 * a specified wait time has elapsed since the last call.
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 * 
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching for:', query);
 * }, 300);
 * 
 * // Will only execute once after 300ms of no calls
 * debouncedSearch('hello');
 * debouncedSearch('hello world');
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Creates a simple rate limiter that prevents a function from being called
 * more than once within a specified time window.
 * 
 * @param func - The function to rate limit
 * @param minInterval - Minimum milliseconds between calls
 * @returns A rate-limited version of the function
 * 
 * @example
 * const rateLimitedClick = rateLimit(() => {
 *   console.log('Button clicked');
 * }, 500);
 * 
 * // Will ignore rapid clicks within 500ms
 * rateLimitedClick(); // executes
 * rateLimitedClick(); // ignored
 * setTimeout(() => rateLimitedClick(), 600); // executes
 */
export function rateLimit<T extends (...args: any[]) => any>(
  func: T,
  minInterval: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;

  return function rateLimited(...args: Parameters<T>) {
    const now = Date.now();
    
    if (now - lastCallTime >= minInterval) {
      lastCallTime = now;
      func(...args);
    }
  };
}
