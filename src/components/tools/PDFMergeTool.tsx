import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileUpload } from '../ui/file-uploader';
import { ArrowDown, FileText, Loader2, X, Move, Shuffle, Grid, List } from 'lucide-react';
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
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); // Start with list view for files
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setIsProcessing(true);
    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);

    // Process new files to extract pages
    const newPages: PageItem[] = [];
    let startFileIndex = files.length;

    try {
      setIsProcessing(true);
      
      // Dynamically import PDF.js
      console.log("Loading PDF.js...");
      const pdfjsLib = await import('pdfjs-dist');
      console.log("PDF.js loaded. Version:", pdfjsLib.version);

      // Set worker source to local file
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      console.log("Worker Source:", pdfjsLib.GlobalWorkerOptions.workerSrc);

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        console.log(`Processing file: ${file.name} (${file.size} bytes)`);
        
        const arrayBuffer = await file.arrayBuffer();
        
        // Load document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        console.log(`PDF loaded. Pages: ${pdf.numPages}`);
          
        for (let j = 1; j <= pdf.numPages; j++) {
            const page = await pdf.getPage(j);
            const viewport = page.getViewport({ scale: 0.5 }); // Thumbnail scale
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
    setFiles(files.filter((_, idx) => idx !== idxToRemove));
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

  const mergePDFs = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();

      // Load all source docs
      const uniqueFileIndices = [...new Set(pages.map(p => p.fileIndex))];
      const pdfDocs: Record<number, PDFDocument> = {};

      for (const idx of uniqueFileIndices) {
          try {
              const arrayBuffer = await files[idx].arrayBuffer();
              pdfDocs[idx] = await PDFDocument.load(arrayBuffer);
          } catch (e: any) {
              if (e.message?.includes('encrypted') || e.name === 'EncryptedPDFError') {
                  throw new Error(`File "${files[idx].name}" is password protected. Please unlock it first using the Security Tool.`);
              }
              throw e;
          }
      }

      for (const page of pages) {
          const sourcePdf = pdfDocs[page.fileIndex];
          const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [page.pageIndex]);
          mergedPdf.addPage(copiedPage);
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
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

      <button
        onClick={mergePDFs}
        disabled={isProcessing || pages.length < 1}
        className={cn(
          "w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95",
          pages.length >= 1 && !isProcessing
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin w-5 h-5" /> Processing...
          </>
        ) : (
          <>
            <ArrowDown className="w-5 h-5" /> Merge {pages.length} Pages
          </>
        )}
      </button>
    </div>
  );
}
