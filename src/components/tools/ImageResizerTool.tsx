import React, { useState, useRef, useEffect } from 'react';
import { FileUpload } from '../ui/file-uploader';
import { Loader2, FileImage } from 'lucide-react';
import { cn } from '../../lib/utils';
import FileSaver from 'file-saver';

export default function ImageResizerTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);

      const img = new Image();
      img.onload = () => {
        setWidth(img.width);
        setHeight(img.height);
        setAspectRatio(img.width / img.height);
        originalImageRef.current = img;
      };
      img.src = url;
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value) || 0;
    setWidth(newWidth);
    if (maintainAspectRatio) {
      setHeight(Math.round(newWidth / aspectRatio));
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value) || 0;
    setHeight(newHeight);
    if (maintainAspectRatio) {
      setWidth(Math.round(newHeight * aspectRatio));
    }
  };

  const handleResize = () => {
    if (!originalImageRef.current || !canvasRef.current) return;
    setIsProcessing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      canvas.width = width;
      canvas.height = height;
      
      // Better quality resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(originalImageRef.current, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          FileSaver.saveAs(blob, `resized-${file?.name || 'image.png'}`);
        }
        setIsProcessing(false);
      }, file?.type || 'image/png', 0.9);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    originalImageRef.current = null;
  };

  return (
    <div className="space-y-8">
      {!file && (
        <FileUpload 
          onFilesSelected={handleFiles}
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
          multiple={false}
        />
      )}

      {file && previewUrl && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center min-h-[400px] shadow-inner">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-w-full max-h-[600px] object-contain shadow-lg" 
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Resize Options</h3>
                <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-900 font-medium">Change File</button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Width (px)</label>
                  <input 
                    type="number" 
                    value={width} 
                    onChange={handleWidthChange}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Height (px)</label>
                  <input 
                    type="number" 
                    value={height} 
                    onChange={handleHeightChange}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                  <input 
                    type="checkbox" 
                    id="aspect"
                    checked={maintainAspectRatio}
                    onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <label htmlFor="aspect" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                    Maintain Aspect Ratio
                  </label>
                </div>
              </div>

              <button
                onClick={handleResize}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transform active:scale-95"
              >
                {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : 'Download Resized Image'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-3">
                <FileImage className="w-5 h-5 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    Original: {originalImageRef.current?.width} x {originalImageRef.current?.height}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
