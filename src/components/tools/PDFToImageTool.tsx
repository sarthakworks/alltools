import React, { useState } from 'react';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { FileUpload } from '../ui/file-uploader';
import { ArrowDown, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';


// Note: PDF.js is imported dynamically to avoid SSR issues

export default function PDFToImageTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setPages([]);
      setProgress(0);
    }
  };

  const convertToImages = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setPages([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const totalPages = pdf.numPages;
      const newPages: string[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High quality scale
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
            await page.render({
            canvasContext: context,
            viewport: viewport
            } as any).promise;

            newPages.push(canvas.toDataURL('image/jpeg', 0.8));
        }
        
        setProgress(Math.round((i / totalPages) * 100));
        setPages([...newPages]); // Update preview progressively
      }
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      alert('Failed to convert PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAll = async () => {
    if (pages.length === 0) return;

    const zip = new JSZip();
    pages.forEach((page, index) => {
      // Remove data URL prefix to get base64
      const data = page.split(',')[1];
      zip.file(`page-${index + 1}.jpg`, data, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(content, 'converted-images.zip');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {!file ? (
        <FileUpload onFilesSelected={handleFilesSelected} accept={{ 'application/pdf': ['.pdf'] }} />
      ) : (
        <div className="space-y-8">
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button 
              onClick={() => setFile(null)}
              className="text-sm text-gray-500 hover:text-gray-900 font-medium"
            >
              Change File
            </button>
          </div>

          {!pages.length && !isProcessing && (
             <div className="flex justify-center">
                <button
                onClick={convertToImages}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                Start Conversion
              </button>
             </div>
          )}

          {isProcessing && (
            <div className="text-center space-y-3 py-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-gray-600">Converting page {Math.ceil((progress / 100) * (pages.length || 1))}...</p>
              <div className="w-full max-w-md mx-auto h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {pages.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Converted Pages ({pages.length})</h3>
                <button
                  onClick={downloadAll}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <ArrowDown className="w-4 h-4" /> Download All (ZIP)
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {pages.map((page, idx) => (
                  <div key={idx} className="relative group aspect-[1/1.4] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                    <img src={page} alt={`Page ${idx + 1}`} className="w-full h-full object-contain" />
                    <a 
                      href={page} 
                      download={`page-${idx + 1}.jpg`}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <ArrowDown className="w-8 h-8 text-white filter drop-shadow-md" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
