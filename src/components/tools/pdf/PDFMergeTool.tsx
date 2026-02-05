import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileUpload } from '../../common/fileUploader';
import { ArrowDown, FileText, X, Move, Shuffle, Grid, List, Lock } from 'lucide-react';
import { cn } from '../../common/utils';
import FileSaver from 'file-saver';
import { usePDF } from '../../common/hooks/usePDF';
import { initPDFWorker, processAndFlattenPDF } from '../../../utils/pdf';
import { ProcessButton } from './common/ProcessButton';
import { DraggablePage } from './common/DraggablePage';
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
  rectSortingStrategy
} from '@dnd-kit/sortable';

interface PageItem {
  id: string; // unique id for dnd
  fileIndex: number;
  pageIndex: number; // 0-based index in the file
  image: string; // data url of the thumbnail
  fileName: string;
}

export default function PDFMergeTool() {
  const {
    files,
    addFiles,
    removeFile,
    replaceFile,
    filesRef,
    isProcessing,
    processingProgress,
    processingMessage,
    setProcessingState
  } = usePDF({ multiple: true });

  const [pages, setPages] = useState<PageItem[]>([]);
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
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setProcessingState(true, 'Processing files...', 0);
    const processedFiles: File[] = [];
    const totalFiles = selectedFiles.length;
    
    // First, try to unlock any encrypted files automatically
    for (let fileIdx = 0; fileIdx < selectedFiles.length; fileIdx++) {
      const file = selectedFiles[fileIdx];
      setProcessingState(true, `Checking file ${fileIdx + 1}/${totalFiles}: ${file.name}`, Math.round(((fileIdx) / totalFiles) * 50));
      
      try {
        // Try to load with pdf-lib to check if encrypted
        const arrayBuffer = await file.arrayBuffer();
        try {
          await PDFDocument.load(arrayBuffer);
          // Not encrypted, use original
          processedFiles.push(file);
        } catch (e: any) {
          if (e.message?.includes('encrypted') || e.name === 'EncryptedPDFError') {
            setProcessingState(true, `Unlocking ${file.name}...`);
            // Try empty password first
            try {
              await PDFDocument.load(arrayBuffer, { password: '' } as any);
              processedFiles.push(file);
            } catch {
              // Empty password failed, try flattening silently
              try {
                const pdfBytes = await processAndFlattenPDF(arrayBuffer, '', (progress) => {
                  const fileProgress = (fileIdx / totalFiles) * 50;
                  const pageProgress = (progress / 100) * (50 / totalFiles);
                  setProcessingState(true, `Unlocking ${file.name}...`, Math.round(fileProgress + pageProgress));
                });
                
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
                setProcessingState(false);
                
                // Add processed files and the pending file to files array
                const startIndexForProcessed = filesRef.current.length;
                addFiles([...processedFiles, file]);
                
                // Generate thumbnails for the processed files so far
                if (processedFiles.length > 0) {
                     generateThumbnails(processedFiles, startIndexForProcessed);
                }
                
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

    const startIndex = filesRef.current.length;
    addFiles(processedFiles);

    // Generate thumbnails with correct start index
    await generateThumbnails(processedFiles, startIndex);
  };
  
  // Wrap generateThumbnails to handle the async state update issue?
  // Actually, I can just traverse the new `processedFiles` and generate thumbnails. Their index will be `allFiles.length` + `i`.
  // Wait, `filesRef.current.length`? 
  // If I call `addFiles(processedFiles)`, the state updates. Re-render happens.
  // But `generateThumbnails` is called in the same closure. 
  // It's safer to separate thumbnail generation.
  // But `generateThumbnails` uses `filesToProcess`.
  
  const generateThumbnails = async (filesToProcess: File[], startIndex: number, password?: string) => {
      setProcessingState(true, 'Generating thumbnails...');
      const pdfjsLib = await import('pdfjs-dist');
      await initPDFWorker();
      
      const newPages: PageItem[] = [];
      
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        setProcessingState(true, `Generating thumbnails ${i + 1}/${filesToProcess.length}`, 50 + Math.round(((i + 1) / filesToProcess.length) * 50));
        
        try {
          const arrayBuffer = await file.arrayBuffer();
          
          let pdf;
          try {
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            pdf = await loadingTask.promise;
          } catch (e: any) {
            if (e.name === 'PasswordException') {
              const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, password: '' });
              pdf = await loadingTask.promise;
            } else {
              throw e;
            }
          }
          
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
        } catch (fileErr: any) {
          console.warn(`Skipping thumbnail generation for ${file.name}:`, fileErr);
        }
      }
      
      setPages(prev => [...prev, ...newPages]);
      if (filesToProcess.length > 0) setViewMode('grid');
      setProcessingState(false);
  };

  const handleRemoveFile = (idxToRemove: number) => {
    removeFile(idxToRemove);
    setPages(prev => prev.filter(p => p.fileIndex !== idxToRemove).map(p => ({
        ...p,
        fileIndex: p.fileIndex > idxToRemove ? p.fileIndex - 1 : p.fileIndex
    })));
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
        setIsUnlocking(true);
        const pdfBytes = await processAndFlattenPDF(arrayBuffer, password, (progress) => {
          setUnlockProgress(progress);
        });
        setIsUnlocking(false);
        
        const flattenedBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        const flattenedFile = new File([flattenedBlob], fileName, { type: 'application/pdf' });
        
        // Replace in files array
        replaceFile(fileIndex, flattenedFile);
        
        // Generate thumbnails for unlocked file
        await generateThumbnails([flattenedFile], fileIndex);
        
        setFilePasswords(prev => ({ ...prev, [fileIndex]: '' }));
        setUseForceUnlock(true); // Reset to true for next file
        setPasswordPrompt(null);
        setPendingFile(null);
        
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
      setIsUnlocking(true);
      try {
        const arrayBuffer = await currentFile.arrayBuffer();
        
        // Unlock and flatten to avoid re-prompting
        const pdfBytes = await processAndFlattenPDF(arrayBuffer, password, (progress) => {
          setUnlockProgress(progress);
        });
        
        const flattenedBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        const flattenedFile = new File([flattenedBlob], fileName, { type: 'application/pdf' });
        
        replaceFile(fileIndex, flattenedFile);
        setFilePasswords(prev => ({ ...prev, [fileIndex]: '' }));
        await generateThumbnails([flattenedFile], fileIndex);
        setPendingFile(null);
        setPasswordPrompt(null);
        
        if (pendingRemainingFiles.length > 0) {
          const remaining = pendingRemainingFiles;
          setPendingRemainingFiles([]);
          setTimeout(() => handleFilesSelected(remaining), 100);
        }
      } catch (err: any) {
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

  const mergePDFs = async () => {
    if (pages.length === 0) return;
    setProcessingState(true, 'Merging PDFs...');

    try {
      const mergedPdf = await PDFDocument.create();
      const uniqueFileIndices = [...new Set(pages.map(p => p.fileIndex))];
      const pdfDocs: Record<number, PDFDocument> = {};

      for (const idx of uniqueFileIndices) {
          const currentFiles = filesRef.current;
          if (!currentFiles[idx]) {
              console.warn(`File at index ${idx} not found, skipping.`);
              continue;
          }

          try {
              const arrayBuffer = await currentFiles[idx].arrayBuffer();
              pdfDocs[idx] = await PDFDocument.load(arrayBuffer);
          } catch (e: any) {
              const fileName = currentFiles[idx]?.name || 'Unknown File';
              if (e.message?.includes('encrypted')) {
                  console.error(`File ${fileName} is still encrypted at merge time`);
                  alert(`ERROR: File "${fileName}" is still encrypted.`);
                  setProcessingState(false);
                  return;
              } else {
                  console.error(`Error loading file ${fileName}:`, e);
                  alert(`Failed to load ${fileName}: ${e.message}`);
                  setProcessingState(false);
                  return;
              }
          }
      }

      for (const page of pages) {
          if (!pdfDocs[page.fileIndex]) continue;
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
      setProcessingState(false);
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
                                onClick={() => handleRemoveFile(idx)}
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
                        onDragStart={(e) => setActiveId(e.active.id as string)}
                    >
                        <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {pages.map((page) => (
                                    <DraggablePage key={page.id} {...page} onRemove={removePage} />
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

      <ProcessButton
          onClick={mergePDFs}
          disabled={isProcessing || pages.length < 1}
          isProcessing={isProcessing}
          processingMessage={processingMessage}
          progress={processingProgress}
          icon={ArrowDown}
      >
           Merge {pages.length} Pages
      </ProcessButton>
    </div>
  );
}
