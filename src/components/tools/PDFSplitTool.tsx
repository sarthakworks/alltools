import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { FileUpload } from '../common/fileUploader';
import { ArrowDown, FileText, Loader2, X, Move, Shuffle, Grid, List, Scissors } from 'lucide-react';
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
  id: string; 
  fileIndex: number;
  pageIndex: number; 
  image: string; 
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

export default function PDFSplitTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
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
      // Dynamically import PDF.js
      const pdfjsLib = await import('pdfjs-dist');
      // Set worker source to local file
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
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
                id: `f${startFileIndex + i}-p${j}-${Date.now()}-${Math.random()}`,
                fileIndex: startFileIndex + i,
                pageIndex: j - 1,
                image: canvas.toDataURL(),
                fileName: file.name
              });
            }
        }
      }
    } catch (err: any) {
      console.error("Error processing PDF:", err);
      alert(`Failed to load PDF: ${err?.message || 'Unknown error'}.`);
    }

    setPages((prev) => [...prev, ...newPages]);
    setIsProcessing(false);
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

  const saveAsSinglePDF = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();
      const uniqueFileIndices = [...new Set(pages.map(p => p.fileIndex))];
      const pdfDocs: Record<number, PDFDocument> = {};

      for (const idx of uniqueFileIndices) {
          const arrayBuffer = await files[idx].arrayBuffer();
          pdfDocs[idx] = await PDFDocument.load(arrayBuffer);
      }

      for (const page of pages) {
          const sourcePdf = pdfDocs[page.fileIndex];
          const [copiedPage] = await mergedPdf.copyPages(sourcePdf, [page.pageIndex]);
          mergedPdf.addPage(copiedPage);
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      FileSaver.saveAs(blob, `splitted-rearranged-${Date.now()}.pdf`);
    } catch (error) {
       console.error(error);
       alert('Error saving PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const extractAllPages = async () => {
      if (pages.length === 0) return;
      setIsProcessing(true);

      try {
        const zip = new JSZip();
        // Load all source PDFs
        const uniqueFileIndices = [...new Set(pages.map(p => p.fileIndex))];
        const pdfDocs: Record<number, PDFDocument> = {};

        for (const idx of uniqueFileIndices) {
            const arrayBuffer = await files[idx].arrayBuffer();
            pdfDocs[idx] = await PDFDocument.load(arrayBuffer);
        }

        // Process each page
        for (let i = 0; i < pages.length; i++) {
             const page = pages[i];
             const sourcePdf = pdfDocs[page.fileIndex];
             
             // Create a new PDF for this single page
             const singleDoc = await PDFDocument.create();
             const [copiedPage] = await singleDoc.copyPages(sourcePdf, [page.pageIndex]);
             singleDoc.addPage(copiedPage);
             
             const pdfBytes = await singleDoc.save();
             zip.file(`Page_${i + 1}_${page.fileName}`, pdfBytes);
        }

        const zipContent = await zip.generateAsync({ type: 'blob' });
        FileSaver.saveAs(zipContent as any, `extracted_pages_${Date.now()}.zip`);

      } catch (error) {
        console.error(error);
        alert('Error extracting pages');
      } finally {
        setIsProcessing(false);
      }
  };

  return (
    <div className="space-y-8">
      {/* Instructions / Controls */}
      {files.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
             <div className="flex items-center gap-2">
                 <Scissors className="w-5 h-5 text-gray-500" />
                 <span className="font-medium text-gray-700">Split & Organize Mode</span>
             </div>
             <div className="text-sm text-gray-500">
                 {pages.length} pages selected
             </div>
          </div>
      )}

      {/* Main Content Area */}
      <div className="min-h-75">
        {files.length === 0 ? (
           <FileUpload onFilesSelected={handleFilesSelected} accept={{ 'application/pdf': ['.pdf'] }} multiple={true} title="Upload PDF to Split" />
        ) : (
            <div className="space-y-6">
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
            </div>
        )}
      </div>

       {files.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={saveAsSinglePDF}
                    disabled={isProcessing}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                >
                    {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    Save as Single PDF
                </button>
                
                <button
                    onClick={extractAllPages}
                    disabled={isProcessing}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all"
                >
                    {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <Grid className="w-5 h-5" />}
                    Extract All as ZIP
                </button>
            </div>
       )}
    </div>
  );
}
