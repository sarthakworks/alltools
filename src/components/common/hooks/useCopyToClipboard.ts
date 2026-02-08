import { useState, useCallback } from 'react';

/**
 * Custom hook for managing clipboard copy operations with temporary feedback
 * 
 * @returns Object containing copiedId state and handleCopy function
 * 
 * @example
 * const { copiedId, handleCopy } = useCopyToClipboard();
 * 
 * <button onClick={() => handleCopy('text to copy', 'button-1')}>
 *   {copiedId === 'button-1' ? 'Copied!' : 'Copy'}
 * </button>
 */
export function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return { copiedId, handleCopy };
}
