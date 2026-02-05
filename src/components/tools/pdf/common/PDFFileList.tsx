import React from 'react';
import { FileText, X } from 'lucide-react';
import { formatFileSize } from '../../../../utils/pdf';
import { FileUpload } from '../../../common/fileUploader';

interface PDFFileListProps {
  files: File[];
  onRemoveFile: (index: number) => void;
  onAddMore: (files: File[]) => void;
}

export function PDFFileList({ files, onRemoveFile, onAddMore }: PDFFileListProps) {
  return (
    <div className="space-y-3">
      {files.map((file, idx) => (
        <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-gray-700">{file.name}</span>
            <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
          </div>
          <button 
            onClick={() => onRemoveFile(idx)}
            className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <div className="mt-6">
        <FileUpload 
          onFilesSelected={onAddMore} 
          accept={{ 'application/pdf': ['.pdf'] }} 
          multiple={true} 
          className="py-8"
          title="Add more files"
        />
      </div>
    </div>
  );
}
