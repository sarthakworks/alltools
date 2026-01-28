import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  className?: string;
}

export function FileUpload({ onFilesSelected, accept, multiple = true, className }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center cursor-pointer transition-all bg-white hover:border-blue-500 hover:bg-blue-50/50",
        isDragActive && "border-blue-500 bg-blue-50",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <div className="p-5 rounded-full bg-blue-50 text-blue-600">
          <Upload className="w-8 h-8" />
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">
            {isDragActive ? "Drop files here" : "Upload your files"}
          </p>
          <p className="text-gray-500 mt-2">
            Click to upload or drag and drop
          </p>
        </div>
      </div>
    </div>
  );
}
