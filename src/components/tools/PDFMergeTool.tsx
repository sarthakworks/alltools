import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileUpload } from '../ui/file-uploader';
import { X, FileText, ArrowDown } from 'lucide-react';
import { cn } from '../../lib/utils'; // Keep importing from utils, assuming it maps correctly using tsconfig paths or relative

// If you have trouble with imports in Astro React islands, use relative paths.

export default function PDFMergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const mergePDFs = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Failed to merge PDFs. Please try again with valid PDF files.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <FileUpload 
        onFilesSelected={handleFiles}
        accept={{ 'application/pdf': ['.pdf'] }}
        multiple={true}
      />

      {files.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-2">
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
          </div>

          <div className="flex justify-end">
            <button
              onClick={mergePDFs}
              disabled={files.length < 2 || isProcessing}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all",
                files.length >= 2 && !isProcessing
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              {isProcessing ? (
                "Processing..."
              ) : (
                <>
                  <ArrowDown className="w-4 h-4" />
                  Merge PDFs
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
