import React, { useState } from 'react';
import { Upload, Download, Loader2, Palette, Sparkles } from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import { useTranslation } from 'react-i18next';
import { FileUpload } from '../ui/file-uploader';

export default function ImageBGRemoverTool() {
  const { t } = useTranslation();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgType, setBgType] = useState<'transparent' | 'color'>('transparent');
  const [fileName, setFileName] = useState('');

  const handleFilesSelected = async (files: File[]) => {
    if (files && files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = () => {
        setOriginalImage(reader.result as string);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!originalImage) return;
    
    setIsProcessing(true);
    try {
      // Convert data URL to Blob
      const response = await fetch(originalImage);
      const blob = await response.blob();
      
      // Remove background
      const imageBlob = await removeBackground(blob);
      
      // If user wants colored background, composite it
      if (bgType === 'color') {
        const img = new Image();
        const url = URL.createObjectURL(imageBlob);
        
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = url;
        });
        
        // Create canvas to add background
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Fill background
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw transparent image on top
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((finalBlob) => {
            if (finalBlob) {
              setProcessedImage(URL.createObjectURL(finalBlob));
            }
          }, 'image/png');
        }
        
        URL.revokeObjectURL(url);
      } else {
        // Use transparent background as-is
        setProcessedImage(URL.createObjectURL(imageBlob));
      }
    } catch (error) {
      console.error('Background removal failed:', error);
      alert('Failed to remove background. Please try a different image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = `no-bg-${fileName}`;
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto">
      {!originalImage ? (
        <FileUpload
          onFilesSelected={handleFilesSelected}
          accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] }}
          multiple={false}
          title={t('tools_ui.common.upload_image')}
        />
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => window.location.reload()} className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                  ← {t('tools_ui.common.new_image')}
                </button>
                
                <div className="w-px h-6 bg-gray-200"></div>
                
                {/* Background Type Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setBgType('transparent')}
                    className={`px-4 py-2 rounded text-sm font-semibold transition-all ${bgType === 'transparent' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
                  >
                    {t('tools_ui.image_bg_remover.transparent')}
                  </button>
                  <button 
                    onClick={() => setBgType('color')}
                    className={`px-4 py-2 rounded text-sm font-semibold transition-all ${bgType === 'color' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'}`}
                  >
                    {t('tools_ui.image_bg_remover.color_fill')}
                  </button>
                </div>

                {bgType === 'color' && (
                  <div className="flex items-center gap-2">
                    <Palette size={16} className="text-gray-400" />
                    <input 
                      type="color" 
                      value={bgColor} 
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                    />
                  </div>
                )}
              </div>

              <button 
                onClick={processImage}
                disabled={isProcessing}
                className="bg-linear-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    {t('tools_ui.common.processing')}
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    {t('tools_ui.common.remove_bg')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Image Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Original */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b border-gray-200 p-3 px-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('tools_ui.image_bg_remover.original_label')}</span>
              </div>
              <div className="p-6 bg-[url('/checker.png')] bg-repeat flex items-center justify-center min-h-100">
                <img src={originalImage} alt="Original" className="max-w-full max-h-125 object-contain" />
              </div>
            </div>

            {/* Processed */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-linear-to-r from-purple-50 to-blue-50 border-b border-purple-200 p-3 px-4">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">{t('tools_ui.image_bg_remover.processed_label')}</span>
              </div>
              <div className={`p-6 ${bgType === 'transparent' ? 'bg-[url(\'/checker.png\')] bg-repeat' : ''} flex items-center justify-center min-h-100`} style={bgType === 'color' ? { backgroundColor: bgColor } : {}}>
                {processedImage ? (
                  <img src={processedImage} alt="Processed" className="max-w-full max-h-125 object-contain" />
                ) : (
                  <div className="text-center text-gray-400">
                    <Sparkles size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('tools_ui.image_bg_remover.empty_state')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {processedImage && (
            <div className="text-center">
              <button 
                onClick={downloadImage}
                className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition-colors shadow-xl flex items-center gap-2 mx-auto"
              >
                <Download size={20} />
                {t('tools_ui.image_bg_remover.download')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
