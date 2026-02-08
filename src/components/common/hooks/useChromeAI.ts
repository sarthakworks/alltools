import { useState, useEffect, useCallback } from 'react';
import type { AIModelStatus } from '../types/chromeAI.types';

/**
 * Custom hook for checking Chrome AI model availability
 * 
 * @returns Object containing model status, check function, and ready state
 * 
 * @example
 * const { modelStatus, checkAvailability, isReady } = useChromeAI();
 * 
 * useEffect(() => {
 *   if (isReady) {
 *     // AI is ready to use
 *   }
 * }, [isReady]);
 */
export function useChromeAI() {
  const [modelStatus, setModelStatus] = useState<AIModelStatus>('checking');

  const handleStatus = useCallback((status: string) => {
    if (status === 'available') setModelStatus('ready');
    else if (status === 'downloadable') setModelStatus('downloading');
    else setModelStatus('unavailable');
  }, []);

  const checkAvailability = useCallback(async () => {
    // Give the browser a moment to inject the AI objects
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // 1. Check for the 2026 global 'ai' object
      if (typeof ai !== 'undefined' && ai.languageModel) {
        const status = await ai.languageModel.availability();
        handleStatus(status);
        return;
      }

      // 2. Check for the flat 'LanguageModel' global
      if (typeof LanguageModel !== 'undefined') {
        const status = await LanguageModel.availability();
        handleStatus(status);
        return;
      }

      // 3. Check window.ai as fallback
      if (window.ai?.languageModel) {
        const status = await window.ai.languageModel.availability();
        handleStatus(status);
        return;
      }

      setModelStatus('unavailable');
    } catch (e) {
      console.error("Chrome AI availability check failed:", e);
      setModelStatus('unavailable');
    }
  }, [handleStatus]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  return {
    modelStatus,
    checkAvailability,
    isReady: modelStatus === 'ready'
  };
}
