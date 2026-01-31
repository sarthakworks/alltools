import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { FileUpload } from '../ui/file-uploader';
import { ArrowDown, Check, FileImage, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import FileSaver from 'file-saver';
import { useTranslation } from 'react-i18next';
import '../../i18n';

export default function ImageCompressorTool() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState(0.8);
  const [enableResize, setEnableResize] = useState(false);
  const [targetWidth, setTargetWidth] = useState(1920);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setCompressedFile(null);
      
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setImageWidth(img.width);
        setImageHeight(img.height);
        setTargetWidth(img.width); // Set slider to original width
      };
      img.src = URL.createObjectURL(selectedFile);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const options: any = {
        useWebWorker: true,
        initialQuality: quality,
      };
      
      if (enableResize) {
        const isPortrait = imageHeight > imageWidth;
        
        if (isPortrait) {
          const aspectRatio = imageHeight / imageWidth;
          const targetHeight = Math.round(targetWidth * aspectRatio);
          options.maxWidthOrHeight = targetHeight; // Constrain height for portrait
        } else {
          options.maxWidthOrHeight = targetWidth;
        }
      }

      const compressed = await imageCompression(file, options);
      setCompressedFile(compressed);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert(t('tools_ui.image_compressor.error_alert') || 'Failed to compress image.');
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
    <div className="max-w-5xl mx-auto">
      {!file && (
        <FileUpload 
          onFilesSelected={handleFiles}
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
          multiple={false}
        />
      )}

      {file && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Preview Side - NOW ON LEFT */}
          <div className="space-y-6">
             {compressedFile ? (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                 <div className="p-6 rounded-xl bg-green-50 border border-green-200 text-center space-y-3">
                   <div className="inline-flex p-3 rounded-full bg-green-100 text-green-600 mb-2">
                     <Check className="w-8 h-8" />
                   </div>
                   <h3 className="text-2xl font-bold text-gray-900">{t('tools_ui.image_compressor.success_title')}</h3>
                   <div className="flex items-center justify-center gap-4 text-sm bg-white py-2 rounded-lg border border-green-100 mx-4">
                     <span className="text-gray-600">{t('tools_ui.image_compressor.new_size')} <span className="text-gray-900 font-mono font-bold">{formatSize(compressedFile.size)}</span></span>
                     <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">{t('tools_ui.image_compressor.saved')} {getSavings()}%</span>
                   </div>
                 </div>

                 <button
                   onClick={downloadCompressed}
                   className="w-full bg-gray-900 text-white hover:bg-black py-4 rounded-xl font-bold text-lg shadow-xl shadow-gray-200 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                 >
                   <ArrowDown className="w-5 h-5" />
                   {t('tools_ui.image_compressor.download_button')}
                 </button>
               </div>
             ) : (
               <div className="h-full min-h-75 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden">
                 {file && (
                   <div className="p-6 flex flex-col items-center justify-center h-full">
                     <img 
                       src={URL.createObjectURL(file)} 
                       alt="Original preview" 
                       className="max-w-full max-h-96 object-contain rounded-lg"
                     />
                     <p className="text-sm text-gray-500 mt-4">Original Image Preview</p>
                   </div>
                 )}
               </div>
             )}
          </div>

          {/* Settings Side - NOW ON RIGHT */}
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">{t('tools_ui.image_compressor.settings')}</h3>
                <button onClick={() => setFile(null)} className="text-sm text-gray-500 hover:text-gray-900 font-medium">{t('tools_ui.image_compressor.change_file')}</button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">{t('tools_ui.image_compressor.quality_label')}</label>
                  <span className="text-2xl font-bold text-blue-600">{Math.round(quality * 100)}%</span>
                </div>
                
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  step="10" 
                  value={Math.round(quality * 100)}
                  onChange={(e) => setQuality(parseInt(e.target.value) / 100)}
                  className="w-full accent-blue-600 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                
                {/* Quality Labels */}
                <div className="flex justify-between text-xs text-gray-500 font-medium -mt-2">
                  <span>10%<br/>{t('tools_ui.image_compressor.quality_heavy')}</span>
                  <span>30%<br/>{t('tools_ui.image_compressor.quality_high')}</span>
                  <span>50%<br/>{t('tools_ui.image_compressor.quality_medium')}</span>
                  <span>70%<br/>{t('tools_ui.image_compressor.quality_low')}</span>
                  <span>100%<br/>{t('tools_ui.image_compressor.quality_original')}</span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                  <p className="font-semibold mb-1">{t('tools_ui.image_compressor.quality_tip')}</p>
                  <p className="text-blue-700">{t('tools_ui.image_compressor.quality_recommendation')}</p>
                </div>
              </div>

              {/* Resize Option */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={enableResize}
                    onChange={(e) => setEnableResize(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t('tools_ui.image_compressor.resize_label')}</span>
                </label>
                
                {enableResize && imageWidth > 0 && (
                  <div className="pl-7 space-y-2 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-600">{t('tools_ui.image_compressor.target_width')}: {targetWidth}px</label>
                      <span className="text-xs text-gray-500">({t('tools_ui.image_compressor.original_width')}: {imageWidth}px)</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max={imageWidth}
                      step="10" 
                      value={targetWidth}
                      onChange={(e) => setTargetWidth(parseInt(e.target.value))}
                      className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-gray-500">{t('tools_ui.image_compressor.aspect_ratio_note')}</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleCompress}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : t('tools_ui.image_compressor.compress_button')}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <FileImage className="w-5 h-5 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">{t('tools_ui.image_compressor.original_width')}: {formatSize(file.size)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
