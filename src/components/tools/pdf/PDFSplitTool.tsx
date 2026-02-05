import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { FileUpload } from '../../common/fileUploader';
import { FileText, Loader2, Grid, Scissors } from 'lucide-react';
import FileSaver from 'file-saver';
import { usePDF } from '../../common/hooks/usePDF';
import { generatePageThumbnails } from '../../../utils/pdf';
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
  id: string; 
  fileIndex: number;
  pageIndex: number; 
  image: string; 
  fileName: string;
}

export default function PDFSplitTool() {
  const {
    files,
    addFiles,
    filesRef,
    isProcessing,
    processingMessage,
    setProcessingState
  } = usePDF({ multiple: true });

  const [pages, setPages] = useState<PageItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFilesSelected = async (selectedFiles: File[]) => {
    const startIndex = filesRef.current.length;
    addFiles(selectedFiles);
    setProcessingState(true, 'Generating thumbnails...');

    try {
      const newPages: PageItem[] = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setProcessingState(true, `Processing ${file.name}...`, Math.round(((i + 1) / selectedFiles.length) * 100));
        
        try {
            const thumbnails = await generatePageThumbnails(file); // No progress hook needed here really as generic msg is fine
            thumbnails.forEach((img, pageIdx) => {
                newPages.push({
                    id: `f${startIndex + i}-p${pageIdx + 1}-${Date.now()}-${Math.random()}`,
                    fileIndex: startIndex + i,
                    pageIndex: pageIdx,
                    image: img,
                    fileName: file.name
                });
            });
        } catch (err: any) {
            console.error(`Error processing ${file.name}:`, err);
            // alert(`Failed to load ${file.name}: ${err.message}`);
        }
      }
      setPages((prev) => [...prev, ...newPages]);
    } catch (error: any) {
        console.error(error);
        alert(`Error: ${error.message}`);
    } finally {
        setProcessingState(false);
    }
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
    setProcessingState(true, 'Creating PDF...');

    try {
      const mergedPdf = await PDFDocument.create();
      const uniqueFileIndices = [...new Set(pages.map(p => p.fileIndex))];
      const pdfDocs: Record<number, PDFDocument> = {};
      const currentFiles = filesRef.current; // Use ref to gain access to all files including newly added ones

      for (const idx of uniqueFileIndices) {
          if (!currentFiles[idx]) continue;
          const arrayBuffer = await currentFiles[idx].arrayBuffer();
          pdfDocs[idx] = await PDFDocument.load(arrayBuffer);
      }

      for (const page of pages) {
          if (!pdfDocs[page.fileIndex]) continue;
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
      setProcessingState(false);
    }
  };

  const extractAllPages = async () => {
      if (pages.length === 0) return;
      setProcessingState(true, 'Extracting pages...');

      try {
        const zip = new JSZip();
        const uniqueFileIndices = [...new Set(pages.map(p => p.fileIndex))];
        const pdfDocs: Record<number, PDFDocument> = {};
        const currentFiles = filesRef.current;

        for (const idx of uniqueFileIndices) {
            if (!currentFiles[idx]) continue;
            const arrayBuffer = await currentFiles[idx].arrayBuffer();
            pdfDocs[idx] = await PDFDocument.load(arrayBuffer);
        }

        for (let i = 0; i < pages.length; i++) {
             const page = pages[i];
             if (!pdfDocs[page.fileIndex]) continue;
             const sourcePdf = pdfDocs[page.fileIndex];
             
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
        setProcessingState(false);
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
                    onDragStart={(e) => setActiveId(e.active.id as string)}
                >
                    <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {pages.map((page) => (
                                <DraggablePage key={page.id} {...page} onRemove={removePage} />
                            ))}
                            {/* Add More Button */}
                            <div className="aspect-3/4 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                 onClick={() => document.getElementById('add-more-pdf-split')?.click()}
                            >
                                <div className="text-center">
                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <span className="text-xl">+</span>
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">Add More</span>
                                </div>
                                <input 
                                    id="add-more-pdf-split" 
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
            </div>
        )}
      </div>

       {files.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProcessButton
                    onClick={saveAsSinglePDF}
                    disabled={isProcessing}
                    isProcessing={isProcessing && processingMessage === 'Creating PDF...'}
                    icon={FileText}
                    processingMessage="Saving..."
                    progress={isProcessing ? 100 : 0} // indeterminate mostly
                >
                    Save as Single PDF
                </ProcessButton>
                
                <ProcessButton
                    onClick={extractAllPages}
                    disabled={isProcessing}
                    isProcessing={isProcessing && processingMessage === 'Extracting pages...'}
                    icon={Grid}
                    processingMessage="Extracting..."
                    className="bg-purple-600 hover:bg-purple-700 shadow-purple-500/20"
                >
                    Extract All as ZIP
                </ProcessButton>
            </div>
       )}
    </div>
  );
}
