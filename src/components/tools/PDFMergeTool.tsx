import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileUpload } from '../ui/file-uploader';
import { ArrowDown, FileText, Loader2, X, Move, Shuffle, Grid, List, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import FileSaver from 'file-saver';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PageItem {
  id: string; // unique id for dnd
  fileIndex: number;
  pageIndex: number; // 0-based index in the file
  image: string; // data url of the thumbnail
  fileName: string;
}

function SortableItem({ id, image, fileName, pageIndex, onRemove }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="group relative aspect-3/4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <img src={image} alt={`Page ${pageIndex + 1}`} className="w-full h-full object-contain p-2" />
      
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onPointerDown={(e) => { e.stopPropagation(); onRemove(id); }}
          className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-2 text-xs text-gray-600 border-t border-gray-100 truncate">
        {fileName} - P{pageIndex + 1}
      </div>
    </div>
  );
}

export default function PDFMergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const filesRef = useRef<File[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filePasswords, setFilePasswords] = useState<Record<number, string>>({});
  const [passwordPrompt, setPasswordPrompt] = useState<{ fileIndex: number; fileName: string } | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [useForceUnlock, setUseForceUnlock] = useState(true);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingRemainingFiles, setPendingRemainingFiles] = useState<File[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  
  // Note: filesRef is manually updated whenever setFiles is called
  // We DON'T use useEffect to sync it, as that would overwrite manual updates
  
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const flattenPDF = async (fileIndex: number, password: string): Promise<Uint8Array> => {
    setIsUnlocking(true);
    setUnlockProgress(0);
    
    try {
      const arrayBuffer = await files[fileIndex].arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        password: password || undefined,
      });

      const pdfViewer = await loadingTask.promise;
      const totalPages = pdfViewer.numPages;

      const newPdf = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdfViewer.getPage(i);
        const viewport = page.getViewport({ scale: 5.0 });
        
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport,
          } as any).promise;

          const imgDataUrl = canvas.toDataURL("image/png");
          const imgBytes = await fetch(imgDataUrl).then((res) => res.arrayBuffer());

          const img = await newPdf.embedPng(imgBytes);
          const newPage = newPdf.addPage([img.width, img.height]);
          newPage.drawImage(img, {
            x: 0,
            y: 0,
            width: img.width,
            height: img.height,
          });
        }
        setUnlockProgress(Math.round((i / totalPages) * 100));
      }
      
      const pdfBytes = await newPdf.save();
      return pdfBytes;
    } finally {
      setIsUnlocking(false);
      setUnlockProgress(0);
    }
  };

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    const processedFiles: File[] = [];
    const totalFiles = selectedFiles.length;
    
    // First, try to unlock any encrypted files automatically
    for (let fileIdx = 0; fileIdx < selectedFiles.length; fileIdx++) {
      const file = selectedFiles[fileIdx];
      setProcessingMessage(`Checking file ${fileIdx + 1}/${totalFiles}: ${file.name}`);
      setProcessingProgress(Math.round(((fileIdx) / totalFiles) * 50)); // 0-50% for file processing
      
      try {
        // Try to load with pdf-lib to check if encrypted
        const arrayBuffer = await file.arrayBuffer();
        try {
          await PDFDocument.load(arrayBuffer);
          // Not encrypted, use original
          processedFiles.push(file);
        } catch (e: any) {
          if (e.message?.includes('encrypted') || e.name === 'EncryptedPDFError') {
            setProcessingMessage(`Unlocking ${file.name}...`);
            // Try empty password first
            try {
              await PDFDocument.load(arrayBuffer, { password: '' } as any);
              processedFiles.push(file);
            } catch {
              // Empty password failed, try flattening silently
              try {
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

                const loadingTask = pdfjsLib.getDocument({
                  data: new Uint8Array(arrayBuffer),
                  password: '',
                });

                const pdfViewer = await loadingTask.promise;
                const totalPages = pdfViewer.numPages;
                const newPdf = await PDFDocument.create();

                for (let i = 1; i <= totalPages; i++) {
                  // Update progress for each page during flattening
                  const fileProgress = (fileIdx / totalFiles) * 50;
                  const pageProgress = (i / totalPages) * (50 / totalFiles);
                  setProcessingProgress(Math.round(fileProgress + pageProgress));
                  setProcessingMessage(`Flattening ${file.name} (page ${i}/${totalPages})...`);
                  
                  const page = await pdfViewer.getPage(i);
                  const viewport = page.getViewport({ scale: 5.0 });
                  
                  const canvas = document.createElement("canvas");
                  const context = canvas.getContext("2d");
                  canvas.width = viewport.width;
                  canvas.height = viewport.height;

                  if (context) {
                    await page.render({
                      canvasContext: context,
                      viewport: viewport,
                    } as any).promise;

                    const imgDataUrl = canvas.toDataURL("image/png");
                    const imgBytes = await fetch(imgDataUrl).then((res) => res.arrayBuffer());

                    const img = await newPdf.embedPng(imgBytes);
                    const newPage = newPdf.addPage([img.width, img.height]);
                    newPage.drawImage(img, {
                      x: 0,
                      y: 0,
                      width: img.width,
                      height: img.height,
                    });
                  }
                }
                
                const pdfBytes = await newPdf.save();
                const flattenedBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
                const flattenedFile = new File([flattenedBlob], file.name, { type: 'application/pdf' });
                processedFiles.push(flattenedFile);
              } catch (flattenErr) {
                // Auto-flatten failed, need user password
                // Show password dialog and wait for user input
                const currentFiles = filesRef.current;
                const fileIndex = currentFiles.length + processedFiles.length;
                setPendingFile(file); // Store the file being processed
                
                // Store remaining files to process after password unlock
                const remainingFiles = selectedFiles.slice(fileIdx + 1);
                setPendingRemainingFiles(remainingFiles);
                
                setPasswordPrompt({ fileIndex, fileName: file.name });
                setIsProcessing(false);
                
                // Add processed files and the pending file to files array
                const newFiles = [...currentFiles, ...processedFiles, file];
                setFiles(newFiles);
                filesRef.current = newFiles;
                
                // Don't add remainingFiles yet - they'll be added when they're processed
                // Stop processing remaining files - user needs to handle this one first
                return;
              }
            }
          } else {
            throw e;
          }
        }
      } catch (err: any) {
        console.error(`Error processing ${file.name}:`, err);
        processedFiles.push(file);
      }
    }

    const currentFiles = filesRef.current;
    const newFiles = [...currentFiles, ...processedFiles];
    setFiles(newFiles);
    filesRef.current = newFiles;

    const newPages: PageItem[] = [];
    let startFileIndex = currentFiles.length;

    try {
      setProcessingMessage('Generating thumbnails...');
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      for (let i = 0; i < processedFiles.length; i++) {
        const file = processedFiles[i];
        setProcessingProgress(50 + Math.round(((i + 1) / processedFiles.length) * 50)); // 50-100% for thumbnails
        
        try {
          const arrayBuffer = await file.arrayBuffer();
          
          // Try to load the PDF, with empty password fallback for encrypted files
          let pdf;
          try {
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            pdf = await loadingTask.promise;
          } catch (e: any) {
            if (e.name === 'PasswordException') {
              // Try with empty password
              const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, password: '' });
              pdf = await loadingTask.promise;
            } else {
              throw e;
            }
          }
          
          for (let j = 1; j <= pdf.numPages; j++) {
              // Update progress for each thumbnail page
              const baseProgress = 50 + (i / processedFiles.length) * 50;
              const pageProgress = (j / pdf.numPages) * (50 / processedFiles.length);
              setProcessingProgress(Math.round(baseProgress + pageProgress));
              setProcessingMessage(`Generating thumbnails ${i + 1}/${processedFiles.length}: page ${j}/${pdf.numPages}`);
              
              const page = await pdf.getPage(j);
              const viewport = page.getViewport({ scale: 0.5 });
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              if (context) {
                await page.render({
                  canvasContext: context,
                  viewport: viewport
                } as any).promise;

                newPages.push({
                  id: `f${startFileIndex + i}-p${j}-${Date.now()}-${Math.random()}`,
                  fileIndex: startFileIndex + i,
                  pageIndex: j - 1,
                  image: canvas.toDataURL(),
                  fileName: file.name
                });
              }
          }
        } catch (fileErr: any) {
          console.warn(`Skipping thumbnail generation for ${file.name}:`, fileErr);
          // File is still encrypted and couldn't generate thumbnails
          // Will handle password during merge
        }
      }
      
      setPages((prev) => [...prev, ...newPages]);
      if (newFiles.length > 0) setViewMode('grid');

    } catch (err: any) {
      console.error("Error processing PDF:", err);
      alert(`Failed to load PDF: ${err?.message || 'Unknown error'}. Check console for details.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (idxToRemove: number) => {
    const newFiles = files.filter((_, idx) => idx !== idxToRemove);
    setFiles(newFiles);
    filesRef.current = newFiles;
    setPages(prev => prev.filter(p => p.fileIndex !== idxToRemove).map(p => ({
        ...p,
        fileIndex: p.fileIndex > idxToRemove ? p.fileIndex - 1 : p.fileIndex
    })));
    const newPasswords = { ...filePasswords };
    delete newPasswords[idxToRemove];
    Object.keys(newPasswords).forEach(key => {
      const numKey = parseInt(key);
      if (numKey > idxToRemove) {
        newPasswords[numKey - 1] = newPasswords[numKey];
        delete newPasswords[numKey];
      }
    });
    setFilePasswords(newPasswords);
  };

  const removePage = (id: string) => {
      setPages(prev => prev.filter(p => p.id !== id));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const handleDragStart = (event: any) => {
      setActiveId(event.active.id);
  }

  const shufflePages = () => {
    setPages(prev => {
        const shuffled = [...prev];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    });
  };

  const handlePasswordSubmit = async () => {
    if (!passwordPrompt) return;
    
    const { fileIndex, fileName } = passwordPrompt;
    const password = passwordInput;
    const currentFile = pendingFile || files[fileIndex];
    
    if (!currentFile) {
      alert('File not found');
      return;
    }
    
    setPasswordInput('');
    
    if (useForceUnlock) {
      try {
        const arrayBuffer = await currentFile.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          password: password || undefined,
        });

        const pdfViewer = await loadingTask.promise;
        const totalPages = pdfViewer.numPages;
        const newPdf = await PDFDocument.create();

        setIsUnlocking(true);
        for (let i = 1; i <= totalPages; i++) {
          const page = await pdfViewer.getPage(i);
          const viewport = page.getViewport({ scale: 5.0 });
          
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (context) {
            await page.render({
              canvasContext: context,
              viewport: viewport,
            } as any).promise;

            const imgDataUrl = canvas.toDataURL("image/png");
            const imgBytes = await fetch(imgDataUrl).then((res) => res.arrayBuffer());

            const img = await newPdf.embedPng(imgBytes);
            const newPage = newPdf.addPage([img.width, img.height]);
            newPage.drawImage(img, {
              x: 0,
              y: 0,
              width: img.width,
              height: img.height,
            });
          }
          setUnlockProgress(Math.round((i / totalPages)* 100));
        }
        setIsUnlocking(false);
        
        const pdfBytes = await newPdf.save();
        const flattenedBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        const flattenedFile = new File([flattenedBlob], fileName, { type: 'application/pdf' });
        
        if (pendingFile) {
          // Upload flow - replace in files array
          const newFiles = [...files];
          newFiles[fileIndex] = flattenedFile;
          setFiles(newFiles);
          filesRef.current = newFiles;
          setPendingFile(null);
        } else {
          // Merge flow - replace in files array
          const newFiles = [...files];
          newFiles[fileIndex] = flattenedFile;
          setFiles(newFiles);
          filesRef.current = newFiles;
        }
        
        // Generate thumbnails for unlocked file
        await generateThumbnails([flattenedFile], fileIndex);
        
        setFilePasswords(prev => ({ ...prev, [fileIndex]: '' }));
        setUseForceUnlock(true); // Reset to true for next file
        setPasswordPrompt(null);
        
        // Continue processing remaining files if any
        // Use setTimeout to ensure state updates propagate
        if (pendingRemainingFiles.length > 0) {
          const remaining = pendingRemainingFiles;
          setPendingRemainingFiles([]);
          setTimeout(() => handleFilesSelected(remaining), 100);
        }
      } catch (err: any) {
        alert(`Force unlock failed: ${err?.message || 'Unknown error'}`);
        setPendingFile(null);
        setIsUnlocking(false);
        setPasswordPrompt(null);
      }
    } else {
      // Try to unlock with password - always flatten to avoid re-prompting
      setIsUnlocking(true);
      try {
        const arrayBuffer = await currentFile.arrayBuffer();
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          password: password || undefined,
        });

        const pdfViewer = await loadingTask.promise;
        const totalPages = pdfViewer.numPages;
        const newPdf = await PDFDocument.create();

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdfViewer.getPage(i);
          const viewport = page.getViewport({ scale: 5.0 });
          
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (context) {
            await page.render({
              canvasContext: context,
              viewport: viewport,
            } as any).promise;

            const imgDataUrl = canvas.toDataURL("image/png");
            const imgBytes = await fetch(imgDataUrl).then((res) => res.arrayBuffer());

            const img = await newPdf.embedPng(imgBytes);
            const newPage = newPdf.addPage([img.width, img.height]);
            newPage.drawImage(img, {
              x: 0,
              y: 0,
              width: img.width,
              height: img.height,
            });
          }
          setUnlockProgress(Math.round((i / totalPages) * 100));
        }
        
        const pdfBytes = await newPdf.save();
        const flattenedBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        const flattenedFile = new File([flattenedBlob], fileName, { type: 'application/pdf' });
        
        // Replace file in array to avoid re-prompting during merge
        const newFiles = [...files];
        newFiles[fileIndex] = flattenedFile;
        setFiles(newFiles);
        filesRef.current = newFiles;
        
        // Password worked, store it and generate thumbnails
        setFilePasswords(prev => ({ ...prev, [fileIndex]: '' }));
        await generateThumbnails([flattenedFile], fileIndex);
        setPendingFile(null);
        setPasswordPrompt(null);
        
        // Continue processing remaining files if any
        // Use setTimeout to ensure state updates propagate
        if (pendingRemainingFiles.length > 0) {
          const remaining = pendingRemainingFiles;
          setPendingRemainingFiles([]);
          setTimeout(() => handleFilesSelected(remaining), 100);
        }
      } catch (err: any) {
        // Check if it's an encryption issue even with password
        if (err.message?.includes('encrypted') || err.message?.includes('ignoreEncryption')) {
          alert(`This PDF uses encryption that requires Force Unlock.\n\nPlease:\n1. Check the "Force Unlock (Flatten PDF)" option\n2. Re-enter your password (or leave empty)\n3. Click Submit again`);
          setPasswordInput('');
          setUseForceUnlock(true);
        } else {
          alert(`Password incorrect or unlock failed: ${err?.message || 'Unknown error'}`);
          setPasswordPrompt(null);
        }
        setPendingFile(null);
      } finally {
        setIsUnlocking(false);
      }
    }
  };

  const generateThumbnails = async (filesToProcess: File[], startIndex: number, password?: string) => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    
    const newPages: PageItem[] = [];
    
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const arrayBuffer = await file.arrayBuffer();
      
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        password: password || undefined
      });
      const pdf = await loadingTask.promise;
      
      for (let j = 1; j <= pdf.numPages; j++) {
        const page = await pdf.getPage(j);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport
          } as any).promise;

          newPages.push({
            id: `f${startIndex + i}-p${j}-${Date.now()}-${Math.random()}`,
            fileIndex: startIndex + i,
            pageIndex: j - 1,
            image: canvas.toDataURL(),
            fileName: file.name
          });
        }
      }
    }
    
    setPages(prev => [...prev, ...newPages]);
    if (files.length > 0) setViewMode('grid');
  };

  const mergePDFs = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();
      const uniqueFileIndices = [...new Set(pages.map(p => p.fileIndex))];
      const pdfDocs: Record<number, PDFDocument> = {};

      for (const idx of uniqueFileIndices) {
          // Use filesRef to get the latest files state, not the closure
          const currentFiles = filesRef.current;
          try {
              const arrayBuffer = await currentFiles[idx].arrayBuffer();
              pdfDocs[idx] = await PDFDocument.load(arrayBuffer);
          } catch (e: any) {
              // If still encrypted, the flattening during upload failed
              if (e.message?.includes('encrypted')) {
                  console.error(`File ${files[idx].name} is still encrypted at merge time`);
                  alert(`ERROR: File "${files[idx].name}" is still encrypted.\n\nThis shouldn't happen. Please:\n1. Clear all files\n2. Re-upload your files\n3. Ensure Force Unlock is enabled (should be default)`);
                  setIsProcessing(false);
                  return;
              } else {
                  console.error(`Error loading file ${files[idx].name}:`, e);
                  alert(`Failed to load ${files[idx].name}: ${e.message}`);
                  setIsProcessing(false);
                  return;
              }
          }
      }

      for (const page of pages) {
          const sourcePdf = pdfDocs[page.fileIndex];
          const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [page.pageIndex]);
          mergedPdf.addPage(copiedPage);
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      FileSaver.saveAs(blob, `merged-document-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Failed to merge PDFs. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* View Toggles & Actions */}
      {files.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex gap-2">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={cn("p-2 rounded-lg transition-colors", viewMode === 'list' ? "bg-white shadow text-blue-600" : "text-gray-500 hover:bg-gray-200")}
                    title="File List View"
                  >
                      <List className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={cn("p-2 rounded-lg transition-colors", viewMode === 'grid' ? "bg-white shadow text-blue-600" : "text-gray-500 hover:bg-gray-200")}
                    title="Page Grid View"
                  >
                      <Grid className="w-5 h-5" />
                  </button>
              </div>

              <div className="flex gap-2">
                  <button 
                    onClick={shufflePages}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                      <Shuffle className="w-4 h-4" /> Shuffle
                  </button>
                  <span className="text-sm text-gray-500 self-center">
                    {pages.length} pages
                  </span>
              </div>
          </div>
      )}

      {/* Main Content Area */}
      <div className="min-h-75">
        {files.length === 0 ? (
           <FileUpload onFilesSelected={handleFilesSelected} accept={{ 'application/pdf': ['.pdf'] }} multiple={true} />
        ) : (
            <>
                {viewMode === 'list' && (
                    <div className="space-y-3">
                         {files.map((file, idx) => (
                            <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                                <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-red-500" />
                                <span className="text-sm font-medium text-gray-700">{file.name}</span>
                                <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                                <button 
                                onClick={() => removeFile(idx)}
                                className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <div className="mt-6">
                            <FileUpload onFilesSelected={handleFilesSelected} accept={{ 'application/pdf': ['.pdf'] }} multiple={true} className="py-8" />
                        </div>
                    </div>
                )}

                {viewMode === 'grid' && (
                    <DndContext 
                        sensors={sensors} 
                        collisionDetection={closestCenter} 
                        onDragEnd={handleDragEnd}
                        onDragStart={handleDragStart}
                    >
                        <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {pages.map((page) => (
                                    <SortableItem key={page.id} {...page} onRemove={removePage} />
                                ))}
                                <div className="aspect-3/4 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                     onClick={() => document.getElementById('add-more-pdf')?.click()}
                                >
                                    <div className="text-center">
                                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <span className="text-xl">+</span>
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">Add More</span>
                                    </div>
                                    <input 
                                        id="add-more-pdf" 
                                        type="file" 
                                        multiple 
                                        accept=".pdf"
                                        className="hidden" 
                                        onChange={(e) => {
                                            if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                                        }}
                                    />
                                </div>
                            </div>
                        </SortableContext>
                        <DragOverlay>
                             {activeId ? (
                                 <div className="aspect-3/4 bg-white rounded-lg shadow-xl overflow-hidden opacity-90 cursor-grabbing border-2 border-blue-500">
                                     <img src={pages.find(p => p.id === activeId)?.image} className="w-full h-full object-contain p-2" />
                                 </div>
                             ) : null}
                        </DragOverlay>
                    </DndContext>
                )}
            </>
        )}
      </div>

      {/* Password Prompt Modal */}
      {passwordPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Password Required</h3>
                <p className="text-sm text-gray-500">File: {passwordPrompt.fileName}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              This PDF is password protected. Please enter the password to continue merging.
            </p>
            
            
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isUnlocking && handlePasswordSubmit()}
              placeholder="Enter password (or leave empty)"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              autoFocus
              disabled={isUnlocking}
            />
            
            <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
              <input
                type="checkbox"
                id="force-unlock-merge"
                checked={useForceUnlock}
                onChange={(e) => setUseForceUnlock(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                disabled={isUnlocking}
              />
              <label htmlFor="force-unlock-merge" className="text-sm text-gray-700 cursor-pointer">
                <span className="font-semibold block text-gray-900">Force Unlock (Flatten PDF)</span>
                <span className="text-gray-500">Enable if password doesn't work. Converts pages to images (high quality).</span>
              </label>
            </div>
            
            {isUnlocking && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Unlocking PDF...</span>
                  <span className="font-medium">{unlockProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${unlockProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handlePasswordSubmit}
                disabled={isUnlocking}
                className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUnlocking ? 'Processing...' : 'Submit'}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              {useForceUnlock 
                ? 'Force Unlock will flatten the PDF by rendering pages as high-quality images.'
                : 'Tip: Check "Force Unlock" if you don\'t know the password or standard unlock fails.'}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={mergePDFs}
        disabled={isProcessing || pages.length < 1}
        className={cn(
          "w-full py-4 rounded-xl font-bold text-lg shadow-lg relative overflow-hidden transition-all transform active:scale-95",
          pages.length >= 1 && !isProcessing
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        )}
      >
        {isProcessing && (
          <div 
            className="absolute inset-0 bg-blue-600 transition-all duration-300"
            style={{ width: `${processingProgress}%` }}
          />
        )}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isProcessing ? (
            <>
              {processingMessage} - {processingProgress}%
            </>
          ) : (
            <>
              <ArrowDown className="w-5 h-5" /> Merge {pages.length} Pages
            </>
          )}
        </span>
      </button>
    </div>
  );
}
