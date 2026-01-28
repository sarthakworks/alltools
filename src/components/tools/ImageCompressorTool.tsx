import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { FileUpload } from '../ui/file-uploader';
import { ArrowDown, Check, FileImage, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import FileSaver from 'file-saver';

export default function ImageCompressorTool() {
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState(0.8);
  const [maxWidth, setMaxWidth] = useState(1920);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setCompressedFile(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const options = {
        maxSizeMB: 1, // Start with generic limit, but quality controls mostly
        maxWidthOrHeight: maxWidth,
        useWebWorker: true,
        initialQuality: quality,
      };

      const compressed = await imageCompression(file, options);
      setCompressedFile(compressed);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Failed to compress image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCompressed = () => {
    if (!compressedFile || !file) return;
    FileSaver.saveAs(compressedFile, `compressed-${file.name}`);
  };

  const formatSize = (size: number) => (size / 1024 / 1024).toFixed(2) + ' MB';

  const getSavings = () => {
    if (!file || !compressedFile) return 0;
    const savings = ((file.size - compressedFile.size) / file.size) * 100;
    return Math.max(0, savings).toFixed(0);
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

      {file && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Settings</h3>
                <button onClick={() => setFile(null)} className="text-sm text-gray-500 hover:text-gray-900 font-medium">Change File</button>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700">Quality: {Math.round(quality * 100)}%</label>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400">Low</span>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.1" 
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="flex-1 accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-400">High</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700">Max Width: {maxWidth}px</label>
                <input 
                  type="range" 
                  min="400" 
                  max="4000" 
                  step="100" 
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(parseInt(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <button
                onClick={handleCompress}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : 'Compress Image'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <FileImage className="w-5 h-5 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">Original: {formatSize(file.size)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
             {compressedFile ? (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                 <div className="p-6 rounded-xl bg-green-50 border border-green-200 text-center space-y-3">
                   <div className="inline-flex p-3 rounded-full bg-green-100 text-green-600 mb-2">
                     <Check className="w-8 h-8" />
                   </div>
                   <h3 className="text-2xl font-bold text-gray-900">Compression Complete!</h3>
                   <div className="flex items-center justify-center gap-4 text-sm bg-white py-2 rounded-lg border border-green-100 mx-4">
                     <span className="text-gray-600">New Size: <span className="text-gray-900 font-mono font-bold">{formatSize(compressedFile.size)}</span></span>
                     <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">Saved {getSavings()}%</span>
                   </div>
                 </div>

                 <button
                   onClick={downloadCompressed}
                   className="w-full bg-gray-900 text-white hover:bg-black py-4 rounded-xl font-bold text-lg shadow-xl shadow-gray-200 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                 >
                   <ArrowDown className="w-5 h-5" />
                   Download Compressed Image
                 </button>
               </div>
             ) : (
               <div className="h-full min-h-[300px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400">
                 <p className="font-medium">Preview will appear here</p>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
