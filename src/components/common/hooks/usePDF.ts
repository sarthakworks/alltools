import { useState, useCallback, useRef } from 'react';

export interface UsePDFOptions {
  multiple?: boolean;
}

export interface UsePDFReturn {
  files: File[];
  isProcessing: boolean;
  processingProgress: number;
  processingMessage: string;
  addFiles: (newFiles: File[]) => void;
  removeFile: (index: number) => void;
  replaceFile: (index: number, newFile: File) => void;
  reorderFiles: (oldIndex: number, newIndex: number) => void;
  clearFiles: () => void;
  setProcessingState: (isProcessing: boolean, message?: string, progress?: number) => void;
  filesRef: React.MutableRefObject<File[]>; // Useful for async operations where state might be stale
}

export function usePDF({ multiple = true }: UsePDFOptions = {}): UsePDFReturn {
  const [files, setFiles] = useState<File[]>([]);
  const filesRef = useRef<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');

  const updateFiles = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    filesRef.current = newFiles;
  }, []);

  const addFiles = useCallback((newFilesToAdd: File[]) => {
    if (!multiple) {
      updateFiles(newFilesToAdd.slice(0, 1));
      return;
    }
    updateFiles([...filesRef.current, ...newFilesToAdd]);
  }, [multiple, updateFiles]);

  const removeFile = useCallback((indexToRemove: number) => {
    const newFiles = filesRef.current.filter((_, index) => index !== indexToRemove);
    updateFiles(newFiles);
  }, [updateFiles]);

  const replaceFile = useCallback((index: number, newFile: File) => {
    const newFiles = [...filesRef.current];
    newFiles[index] = newFile;
    updateFiles(newFiles);
  }, [updateFiles]);

  const reorderFiles = useCallback((oldIndex: number, newIndex: number) => {
    const newFiles = [...filesRef.current];
    const [removed] = newFiles.splice(oldIndex, 1);
    newFiles.splice(newIndex, 0, removed);
    updateFiles(newFiles);
  }, [updateFiles]);

  const clearFiles = useCallback(() => {
    updateFiles([]);
  }, [updateFiles]);

  const setProcessingState = useCallback((processing: boolean, message: string = '', progress: number = 0) => {
    setIsProcessing(processing);
    setProcessingMessage(message);
    setProcessingProgress(progress);
  }, []);

  return {
    files,
    isProcessing,
    processingProgress,
    processingMessage,
    addFiles,
    removeFile,
    replaceFile,
    reorderFiles,
    clearFiles,
    setProcessingState,
    filesRef
  };
}
