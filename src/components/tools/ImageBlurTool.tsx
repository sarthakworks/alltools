import React, { useRef, useState, useEffect } from 'react';
import { Download, EyeOff, Upload, RotateCcw, Square } from 'lucide-react';

export default function ImageBlurTool() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [blurType, setBlurType] = useState<'blur' | 'pixelate'>('blur');
  
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const img = new Image();
      img.src = URL.createObjectURL(e.target.files[0]);
      img.onload = () => {
        setImage(img);
        if (mainCanvasRef.current && overlayCanvasRef.current) {
          const mainCtx = mainCanvasRef.current.getContext('2d');
          mainCanvasRef.current.width = img.width;
          mainCanvasRef.current.height = img.height;
          overlayCanvasRef.current.width = img.width;
          overlayCanvasRef.current.height = img.height;
          mainCtx?.drawImage(img, 0, 0);
        }
      };
    }
  };

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
    if (!image) return;
    setIsDrawing(true);
    const pos = getPos(e);
    setStartPos(pos);
    setCurrentPos(pos);
  };

  const updateSelection = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !image) return;
    const pos = getPos(e);
    setCurrentPos(pos);
    drawSelectionBox(pos);
  };

  const endSelection = () => {
    setIsDrawing(false);
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
    if (!mainCanvasRef.current || !overlayCanvasRef.current) return;
    
    const { x, y, w, h } = getSelectionRect();
    if (w === 0 || h === 0) return;

    const ctx = mainCanvasRef.current.getContext('2d');
    if (!ctx) return;

    // Get the selected region
    const imageData = ctx.getImageData(x, y, w, h);
    
    if (blurType === 'blur') {
      applyGaussianBlur(imageData, w, h, 15);
    } else {
      applyPixelation(imageData, w, h, 10);
    }
    
    ctx.putImageData(imageData, x, y);
    
    // Clear overlay
    const overlayCtx = overlayCanvasRef.current.getContext('2d');
    overlayCtx?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
  };

  const applyGaussianBlur = (imageData: ImageData, width: number, height: number, radius: number) => {
    const pixels = imageData.data;
    const tempPixels = new Uint8ClampedArray(pixels);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const i = (ny * width + nx) * 4;
              r += tempPixels[i];
              g += tempPixels[i + 1];
              b += tempPixels[i + 2];
              a += tempPixels[i + 3];
              count++;
            }
          }
        }
        
        const i = (y * width + x) * 4;
        pixels[i] = r / count;
        pixels[i + 1] = g / count;
        pixels[i + 2] = b / count;
        pixels[i + 3] = a / count;
      }
    }
  };

  const applyPixelation = (imageData: ImageData, width: number, height: number, blockSize: number) => {
    const pixels = imageData.data;
    
    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        
        for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
          for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
            const i = ((y + dy) * width + (x + dx)) * 4;
            r += pixels[i];
            g += pixels[i + 1];
            b += pixels[i + 2];
            a += pixels[i + 3];
            count++;
          }
        }
        
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        a = Math.floor(a / count);
        
        for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
          for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
            const i = ((y + dy) * width + (x + dx)) * 4;
            pixels[i] = r;
            pixels[i + 1] = g;
            pixels[i + 2] = b;
            pixels[i + 3] = a;
          }
        }
      }
    }
  };

  const getSelectionRect = () => {
    const w = currentPos.x - startPos.x;
    const h = currentPos.y - startPos.y;
    return { 
      x: w < 0 ? currentPos.x : startPos.x, 
      y: h < 0 ? currentPos.y : startPos.y, 
      w: Math.abs(w), 
      h: Math.abs(h) 
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
    if (!image || !mainCanvasRef.current) return;
    const ctx = mainCanvasRef.current.getContext('2d');
    ctx?.clearRect(0, 0, mainCanvasRef.current.width, mainCanvasRef.current.height);
    ctx?.drawImage(image, 0, 0);
    const overlayCtx = overlayCanvasRef.current?.getContext('2d');
    overlayCtx?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {!image ? (
        <div className="w-full max-w-xl p-12 text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-3xl hover:bg-white hover:border-blue-400 transition-colors cursor-pointer relative group">
          <input type="file" onChange={handleFileChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
          <div className="bg-blue-100 p-4 rounded-full w-fit mx-auto text-blue-600 mb-4 group-hover:scale-110 transition-transform">
            <Upload size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Image to Blur</h3>
          <p className="text-gray-500 text-sm">JPG, PNG, WebP supported</p>
        </div>
      ) : (
        <div className="w-full max-w-5xl">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 mb-4 justify-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg text-gray-700 font-medium text-sm">
              <Upload size={16} /> New Image
            </button>
            
            <div className="w-px bg-gray-200"></div>
            
            {/* Blur Type Selector */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setBlurType('blur')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${blurType === 'blur' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
              >
                Blur
              </button>
              <button 
                onClick={() => setBlurType('pixelate')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${blurType === 'pixelate' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600'}`}
              >
                Pixelate
              </button>
            </div>

            <button onClick={applyEffect} disabled={!isDrawing && currentPos.x === 0} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold text-sm disabled:opacity-50">
              <EyeOff size={16} /> Apply {blurType === 'blur' ? 'Blur' : 'Pixelate'}
            </button>
            
            <button onClick={reset} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg text-gray-700 font-medium text-sm">
              <RotateCcw size={16} /> Reset
            </button>

            <div className="w-px bg-gray-200"></div>
            
            <button onClick={downloadImage} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white hover:bg-black rounded-lg font-bold text-sm">
              <Download size={16} /> Download
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mb-4 bg-blue-50 py-2 px-4 rounded-lg border border-blue-100">
            <Square size={14} className="inline mr-2" />
            Click and drag to select area, then click "Apply {blurType === 'blur' ? 'Blur' : 'Pixelate'}"
          </p>

          {/* Canvas Container */}
          <div className="relative overflow-hidden border border-gray-200 rounded-xl shadow-lg bg-white w-fit mx-auto">
            <canvas 
              ref={mainCanvasRef}
              className="max-h-[70vh] w-auto h-auto block"
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
              className="absolute top-0 left-0 max-h-[70vh] w-auto h-auto block touch-none cursor-crosshair"
              style={{ pointerEvents: 'auto' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
