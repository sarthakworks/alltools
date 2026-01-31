import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileUpload } from '../common/fileUploader';
import { ArrowDown, Loader2, X, Image as ImageIcon } from 'lucide-react';
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
import { useTranslation } from 'react-i18next';
import '../../i18n';

interface ImageItem {
  id: string;
  file: File;
  preview: string;
}

function SortableItem({ id, preview, fileName, onRemove }: any) {
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
      className="group relative aspect-square bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <img src={preview} alt={fileName} className="w-full h-full object-cover" />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onPointerDown={(e) => { e.stopPropagation(); onRemove(id); }}
          className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function ImageToPDFTool() {
  const { t } = useTranslation();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFilesSelected = (files: File[]) => {
    const newImages = files.map(file => ({
        id: `img-${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const convertToPDF = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
        const pdfDoc = await PDFDocument.create();

        for (const imgItem of images) {
            const arrayBuffer = await imgItem.file.arrayBuffer();
            let pdfImage;
            
            if (imgItem.file.type === 'image/jpeg' || imgItem.file.type === 'image/jpg') {
                pdfImage = await pdfDoc.embedJpg(arrayBuffer);
            } else if (imgItem.file.type === 'image/png') {
                pdfImage = await pdfDoc.embedPng(arrayBuffer);
            } else {
                continue; // Skip unsupported
            }

            const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
            page.drawImage(pdfImage, {
                x: 0,
                y: 0,
                width: pdfImage.width,
                height: pdfImage.height,
            });
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        FileSaver.saveAs(blob, `images-combined-${Date.now()}.pdf`);

    } catch (error) {
        console.error(error);
        alert(t('tools_ui.image_to_pdf.error_alert'));
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
        {images.length === 0 ? (
            <FileUpload 
                onFilesSelected={handleFilesSelected} 
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }} 
                multiple={true} 
            />
        ) : (
            <>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">{images.length} {t('tools_ui.image_to_pdf.selected_images')}</h3>
                    </div>
                    
                    <DndContext 
                        sensors={sensors} 
                        collisionDetection={closestCenter} 
                        onDragEnd={handleDragEnd}
                        onDragStart={(e) => setActiveId(e.active.id as string)}
                    >
                        <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {images.map((img) => (
                                    <SortableItem key={img.id} {...img} fileName={img.file.name} onRemove={removeImage} />
                                ))}
                                <div className="aspect-square flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                     onClick={() => document.getElementById('add-more-img')?.click()}
                                >
                                    <div className="text-center">
                                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <span className="text-xl">+</span>
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">{t('tools_ui.image_to_pdf.add_images')}</span>
                                    </div>
                                    <input 
                                        id="add-more-img" 
                                        type="file" 
                                        multiple 
                                        accept="image/*"
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
                                <div className="aspect-square bg-white rounded-xl shadow-xl overflow-hidden opacity-90 cursor-grabbing border-2 border-blue-500">
                                    <img src={images.find(i => i.id === activeId)?.preview} className="w-full h-full object-cover" />
                                </div>
                             ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>

                <button
                    onClick={convertToPDF}
                    disabled={isProcessing}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                >
                    {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                    {t('tools_ui.image_to_pdf.convert_button')}
                </button>
            </>
        )}
    </div>
  );
}
