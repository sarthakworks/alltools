import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Download, EyeOff, Upload, RotateCcw, MousePointerClick } from 'lucide-react';
import { FileUpload } from '../common/fileUploader';
import { useTranslation } from 'react-i18next';
import '../../i18n';

export default function ImageBlurTool() {
  const { t } = useTranslation();
  const [src, setSrc] = useState<string | null>(null);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [history, setHistory] = useState<string[]>([]); // Stack of image states
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [completedCrop, setCompletedCrop] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [blurType, setBlurType] = useState<'blur' | 'pixelate'>('blur');
  const [blurIntensity, setBlurIntensity] = useState(15);
  
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load image
  const handleFilesSelected = (files: File[]) => {
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const image = new Image();
        image.src = reader.result as string;
        image.onload = () => {
          setSrc(reader.result as string);
          setBaseImage(image);
          setHistory([reader.result as string]); // Initialize history with original
          setCompletedCrop(null);
          setStartPos({ x: 0, y: 0 });
          setCurrentPos({ x: 0, y: 0 });
        };
      });
      reader.readAsDataURL(files[0]);
    }
  };

  // Draw function - reliably draws base image + any effects
  const drawCanvas = useCallback(() => {
    if (!baseImage || !mainCanvasRef.current) return;

    const canvas = mainCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match image
    if (canvas.width !== baseImage.width || canvas.height !== baseImage.height) {
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;
      
      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = baseImage.width;
        overlayCanvasRef.current.height = baseImage.height;
      }
    }

    // Clear and draw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0);

    // Apply completed blur if exists
    if (completedCrop && completedCrop.w > 0 && completedCrop.h > 0) {
      const { x, y, w, h } = completedCrop;
      
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();

      if (blurType === 'blur') {
        ctx.filter = `blur(${blurIntensity}px)`;
        ctx.drawImage(baseImage, 0, 0);
        ctx.filter = 'none';
      } else {
        // Pixelate
        const blockSize = Math.max(2, Math.floor(blurIntensity / 3));
        for (let py = y; py < y + h; py += blockSize) {
          for (let px = x; px < x + w; px += blockSize) {
            const imageData = ctx.getImageData(px, py, 1, 1).data;
            ctx.fillStyle = `rgb(${imageData[0]},${imageData[1]},${imageData[2]})`;
            ctx.fillRect(px, py, blockSize, blockSize);
          }
        }
      }
      ctx.restore();
    }
  }, [baseImage, completedCrop, blurType, blurIntensity]);

  // Redraw whenever dependencies change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!overlayCanvasRef.current) return { x: 0, y: 0 };
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const scaleX = overlayCanvasRef.current.width / rect.width;
    const scaleY = overlayCanvasRef.current.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startSelection = (e: React.MouseEvent | React.TouchEvent) => {
    if (!baseImage) return;
    setIsDrawing(true);
    const pos = getPos(e);
    setStartPos(pos);
    setCurrentPos(pos);
  };

  const updateSelection = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !baseImage) return;
    const pos = getPos(e);
    setCurrentPos(pos);
    drawSelectionBox(pos);
  };

  const endSelection = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Auto-apply effect when selection ends
    const w = currentPos.x - startPos.x;
    const h = currentPos.y - startPos.y;
    
    if (Math.abs(w) > 10 && Math.abs(h) > 10) { // Minimum selection size
      applyEffect();
    } else {
      // Clear overlay if selection too small
      if (overlayCanvasRef.current) {
        const overlayCtx = overlayCanvasRef.current.getContext('2d');
        overlayCtx?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
    }
  };

  const drawSelectionBox = (endPos: { x: number; y: number }) => {
    if (!overlayCanvasRef.current) return;
    const ctx = overlayCanvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    
    const w = endPos.x - startPos.x;
    const h = endPos.y - startPos.y;

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(startPos.x, startPos.y, w, h);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(startPos.x, startPos.y, w, h);
  };

  const applyEffect = () => {
    const w = currentPos.x - startPos.x;
    const h = currentPos.y - startPos.y;
    
    if (Math.abs(w) === 0 || Math.abs(h) === 0) return;

    setCompletedCrop({
      x: w < 0 ? currentPos.x : startPos.x,
      y: h < 0 ? currentPos.y : startPos.y,
      w: Math.abs(w),
      h: Math.abs(h)
    });

    // Wait for next frame to ensure effect is drawn to canvas
    requestAnimationFrame(() => {
      if (!mainCanvasRef.current) return;
      
      const newDataUrl = mainCanvasRef.current.toDataURL('image/png');
      
      // Add to history
      setHistory(prev => [...prev, newDataUrl]);
      
      // Update base image
      const newImg = new Image();
      newImg.src = newDataUrl;
      newImg.onload = () => {
        setBaseImage(newImg);
        setCompletedCrop(null);
        setStartPos({ x: 0, y: 0 });
        setCurrentPos({ x: 0, y: 0 });
        
        // Clear overlay
        if (overlayCanvasRef.current) {
             const overlayCtx = overlayCanvasRef.current.getContext('2d');
             overlayCtx?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
      };
    });
  };

  const undo = () => {
    if (history.length <= 1) return; // Can't undo original
    
    const newHistory = [...history];
    newHistory.pop(); // Remove current state
    const prevDataUrl = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    
    const newImg = new Image();
    newImg.src = prevDataUrl;
    newImg.onload = () => {
      setBaseImage(newImg);
      setCompletedCrop(null);
      setStartPos({ x: 0, y: 0 });
      setCurrentPos({ x: 0, y: 0 });
    };
  };

  const downloadImage = () => {
    if (!mainCanvasRef.current) return;
    mainCanvasRef.current.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'blurred-image.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  const reset = () => {
    if (!src) return;
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setBaseImage(img);
      setCompletedCrop(null);
      setStartPos({ x: 0, y: 0 });
      setCurrentPos({ x: 0, y: 0 });
      if (overlayCanvasRef.current) {
        const overlayCtx = overlayCanvasRef.current.getContext('2d');
        overlayCtx?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
    };
  };

  return (
    <div className="max-w-5xl mx-auto">
      {!src ? (
        <FileUpload
          onFilesSelected={handleFilesSelected}
          accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] }}
          multiple={false}
          title={t('tools_ui.image_blur.upload_title')}
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl">
          {/* Left: Canvas */}
          <div className="flex-1">
            <p className="text-center text-sm text-gray-500 mb-4 bg-blue-50 py-2 px-4 rounded-lg border border-blue-100">
              <MousePointerClick size={14} className="inline mr-2" />
              {t('tools_ui.image_blur.instruction')}
            </p>

            {/* Canvas Container */}
            <div className="relative overflow-auto border border-gray-200 rounded-xl shadow-lg bg-white w-fit max-w-150 max-h-150">
              <canvas 
                ref={mainCanvasRef}
                className="block"
              />
              <canvas 
                ref={overlayCanvasRef}
                onMouseDown={startSelection}
                onMouseMove={updateSelection}
                onMouseUp={endSelection}
                onMouseLeave={endSelection}
                onTouchStart={startSelection}
                onTouchMove={updateSelection}
                onTouchEnd={endSelection}
                className="absolute top-0 left-0 block touch-none cursor-crosshair"
                style={{ pointerEvents: 'auto' }}
              />
            </div>
          </div>

          {/* Right: Controls Sidebar */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg sticky top-6 space-y-6">
              <h3 className="text-lg font-bold text-gray-900">{t('tools_ui.image_blur.settings')}</h3>

              {/* Blur Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">{t('tools_ui.image_blur.effect_type')}</label>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setBlurType('blur')}
                    className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition-all ${blurType === 'blur' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
                  >
                    {t('tools_ui.image_blur.blur')}
                  </button>
                  <button 
                    onClick={() => setBlurType('pixelate')}
                    className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition-all ${blurType === 'pixelate' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'}`}
                  >
                    {t('tools_ui.image_blur.pixelate')}
                  </button>
                </div>
              </div>

              {/* Intensity Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">{t('tools_ui.image_blur.intensity')}</label>
                  <span className="text-sm font-bold text-blue-600">{blurIntensity}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={blurIntensity}
                  onChange={(e) => setBlurIntensity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{t('tools_ui.image_blur.light')}</span>
                  <span>{t('tools_ui.image_blur.heavy')}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-3">
                <button 
                  onClick={undo} 
                  disabled={history.length <= 1} 
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white hover:bg-orange-700 rounded-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw size={18} /> {t('tools_ui.image_blur.undo')}
                </button>
                
                <button 
                  onClick={reset} 
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors"
                >
                  <RotateCcw size={18} /> {t('tools_ui.image_blur.reset')}
                </button>
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-3">
                <button 
                  onClick={downloadImage} 
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white hover:bg-black rounded-lg font-bold text-sm transition-colors"
                >
                  <Download size={18} /> {t('tools_ui.image_blur.download')}
                </button>

                <button 
                  onClick={() => window.location.reload()} 
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-medium text-sm transition-colors"
                >
                  <Upload size={18} /> {t('tools_ui.image_blur.upload_new')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
