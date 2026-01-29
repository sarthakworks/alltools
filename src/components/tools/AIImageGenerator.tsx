import React, { useState } from 'react';
import { Download, Loader2, Image as ImageIcon, Sparkles, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { cn } from '../../lib/utils';

const STYLES = [
  { id: 'realistic', name: 'Realistic', prompt: 'photorealistic, highly detailed, 8k, cinematic lighting' },
  { id: 'anime', name: 'Anime', prompt: 'anime style, studio ghibli, vibrant colors' },
  { id: '3d', name: '3D Render', prompt: '3d render, blender, unreal engine 5, isometric' },
  { id: 'painting', name: 'Painting', prompt: 'digital painting, oil on canvas, artistic, masterpiece' },
  { id: 'cyberpunk', name: 'Cyberpunk', prompt: 'cyberpunk, neon lights, futuristic, high tech' },
];

const RATIOS = [
  { id: 'square', name: 'Square (1:1)', width: 1024, height: 1024, icon: ImageIcon },
  { id: 'portrait', name: 'Portrait (9:16)', width: 768, height: 1344, icon: Smartphone },
  { id: 'landscape', name: 'Landscape (16:9)', width: 1344, height: 768, icon: Monitor },
];

export default function AIImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState(STYLES[0].id);
  const [ratio, setRatio] = useState(RATIOS[0].id);
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [seed, setSeed] = useState(Math.floor(Math.random() * 1000));

  const generateImage = () => {
    if (!prompt) return;
    
    setIsLoading(true);
    // Force a new image by updating the seed
    const newSeed = Math.floor(Math.random() * 100000);
    setSeed(newSeed);

    const selectedStyle = STYLES.find(s => s.id === style);
    const selectedRatio = RATIOS.find(r => r.id === ratio);
    
    // Construct Pollinations URL
    // Format: https://image.pollinations.ai/prompt/{prompt}?width={w}&height={h}&seed={seed}&nologo=true
    const fullPrompt = encodeURIComponent(`${prompt}, ${selectedStyle?.prompt}`);
    const url = `https://image.pollinations.ai/prompt/${fullPrompt}?width=${selectedRatio?.width || 1024}&height=${selectedRatio?.height || 1024}&seed=${newSeed}&nologo=true&model=flux`;
    
    // Pre-load image to handle loading state
    const img = new Image();
    img.onload = () => {
      setImageUrl(url);
      setIsLoading(false);
    };
    img.src = url;
  };

  const downloadImage = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-image-${seed}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error("Download failed", e);
      // Fallback to opening in new tab
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Controls */}
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Image Description</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic city floating in the clouds..."
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none shadow-sm placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Art Style</label>
              <select 
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
              >
                {STYLES.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Size</label>
              <div className="grid grid-cols-3 gap-2">
                {RATIOS.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRatio(r.id)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all",
                        ratio === r.id 
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                          : "bg-white border-gray-100 hover:border-gray-200 text-gray-500"
                      )}
                      title={r.name}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] font-medium">{r.width === r.height ? '1:1' : r.width > r.height ? '16:9' : '9:16'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={generateImage}
            disabled={isLoading || !prompt}
            className="w-full bg-linear-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" /> Creating Magic...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Generate Image
              </>
            )}
          </button>
        </div>

        <div className="p-4 bg-indigo-50 rounded-xl text-xs text-indigo-800 border border-indigo-100 flex gap-2">
           <ImageIcon className="w-4 h-4 shrink-0 mt-0.5" />
           <p>Images are generated securely using the Pollinations.ai API. No API keys required. Images are free to use.</p>
        </div>
      </div>

      {/* Preview */}
      <div className="h-full min-h-96 flex flex-col">
        {imageUrl ? (
          <div className="relative group flex-1 bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center shadow-xl">
             <img 
               src={imageUrl} 
               alt={prompt}
               className={cn(
                 "max-w-full max-h-150 object-contain transition-opacity duration-500",
                 isLoading ? "opacity-50 blur-sm" : "opacity-100"
               )}
             />
             
             {!isLoading && (
               <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <div className="w-full flex justify-between items-center">
                    <p className="text-white text-sm line-clamp-1 opacity-90 max-w-[70%]">{prompt}</p>
                    <button 
                      onClick={downloadImage}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors border border-white/10"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </div>
               </div>
             )}

             {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-white animate-spin opacity-80" />
                </div>
             )}
          </div>
        ) : (
          <div className="flex-1 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 p-8 text-center min-h-96">
            <div>
              <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50 text-pink-300" />
              <p className="font-medium text-gray-500 text-lg">Dream it. See it.</p>
              <p className="text-sm text-gray-400 mt-2">Enter a prompt to generate artwork instantly.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
