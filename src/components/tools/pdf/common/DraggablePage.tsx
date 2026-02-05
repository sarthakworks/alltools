import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';

export interface PageItem {
  id: string; 
  fileIndex: number;
  pageIndex: number; 
  image: string; 
  fileName: string;
}

interface DraggablePageProps extends PageItem {
  onRemove: (id: string) => void;
}

export function DraggablePage({ id, image, fileName, pageIndex, onRemove }: DraggablePageProps) {
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
