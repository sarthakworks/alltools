import React, { useState } from 'react';
import { Upload, Download, Loader2, Palette, Sparkles } from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';

export default function ImageBGRemoverTool() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgType, setBgType] = useState<'transparent' | 'color'>('transparent');
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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
        <div className="w-full max-w-xl mx-auto p-12 text-center bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-dashed border-purple-300 rounded-3xl hover:from-purple-100 hover:to-blue-100 hover:border-purple-400 transition-all cursor-pointer relative group">
          <input type="file" onChange={handleFileChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
          <div className="bg-purple-100 p-4 rounded-full w-fit mx-auto text-purple-600 mb-4 group-hover:scale-110 transition-transform">
            <Sparkles size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Image</h3>
          <p className="text-gray-500 text-sm">AI will automatically remove the background</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => window.location.reload()} className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                  ← New Image
                </button>
                
                <div className="w-px h-6 bg-gray-200"></div>
                
                {/* Background Type Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setBgType('transparent')}
                    className={`px-4 py-2 rounded text-sm font-semibold transition-all ${bgType === 'transparent' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
                  >
                    Transparent
                  </button>
                  <button 
                    onClick={() => setBgType('color')}
                    className={`px-4 py-2 rounded text-sm font-semibold transition-all ${bgType === 'color' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'}`}
                  >
                    Color Fill
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
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Remove Background
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
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Original</span>
              </div>
              <div className="p-6 bg-[url('/checker.png')] bg-repeat flex items-center justify-center min-h-[400px]">
                <img src={originalImage} alt="Original" className="max-w-full max-h-[500px] object-contain" />
              </div>
            </div>

            {/* Processed */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200 p-3 px-4">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">Background Removed</span>
              </div>
              <div className={`p-6 ${bgType === 'transparent' ? 'bg-[url(\'/checker.png\')] bg-repeat' : ''} flex items-center justify-center min-h-[400px]`} style={bgType === 'color' ? { backgroundColor: bgColor } : {}}>
                {processedImage ? (
                  <img src={processedImage} alt="Processed" className="max-w-full max-h-[500px] object-contain" />
                ) : (
                  <div className="text-center text-gray-400">
                    <Sparkles size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Click "Remove Background" to process</p>
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
                Download PNG
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
