import React, { useState } from 'react';
import { Upload, Copy, FileText, Loader2, Languages } from 'lucide-react';
import { createWorker } from 'tesseract.js';

export default function ImageOCRTool() {
  const [image, setImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState('eng');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setExtractedText('');
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const extractText = async () => {
    if (!image) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const worker = await createWorker(language, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        }
      });
      
      const { data: { text } } = await worker.recognize(image);
      setExtractedText(text);
      
      await worker.terminate();
    } catch (error) {
      console.error('OCR failed:', error);
      alert('Text extraction failed. Please try a different image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadText = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-text.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {!image ? (
        <div className="w-full max-w-xl mx-auto p-12 text-center bg-gradient-to-br from-green-50 to-blue-50 border-2 border-dashed border-green-300 rounded-3xl hover:from-green-100 hover:to-blue-100 hover:border-green-400 transition-all cursor-pointer relative group">
          <input type="file" onChange={handleFileChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
          <div className="bg-green-100 p-4 rounded-full w-fit mx-auto text-green-600 mb-4 group-hover:scale-110 transition-transform">
            <FileText size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Image with Text</h3>
          <p className="text-gray-500 text-sm">Screenshots, documents, photos with text</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <button onClick={() => window.location.reload()} className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              ← New Image
            </button>

            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <Languages size={16} className="text-gray-400" />
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="eng">English</option>
                  <option value="spa">Spanish</option>
                  <option value="fra">French</option>
                  <option value="deu">German</option>
                  <option value="chi_sim">Chinese (Simplified)</option>
                  <option value="jpn">Japanese</option>
                  <option value="kor">Korean</option>
                  <option value="ara">Arabic</option>
                  <option value="hin">Hindi</option>
                </select>
              </div>

              <button 
                onClick={extractText}
                disabled={isProcessing}
                className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    {progress > 0 ? `${progress}%` : 'Loading...'}
                  </>
                ) : (
                  <>
                    <FileText size={18} />
                    Extract Text
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Image and Text Side by Side */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Image Preview */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b border-gray-200 p-3 px-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Image</span>
              </div>
              <div className="p-6 bg-gray-50 flex items-center justify-center min-h-[500px]">
                <img src={image} alt="Upload" className="max-w-full max-h-[500px] object-contain rounded-lg border border-gray-200 bg-white" />
              </div>
            </div>

            {/* Extracted Text */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
              <div className="bg-green-50 border-b border-green-200 p-3 px-4 flex justify-between items-center">
                <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Extracted Text</span>
                {extractedText && (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCopy}
                      className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors font-semibold ${copySuccess ? 'bg-green-100 text-green-700' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
                    >
                      {copySuccess ? 'Copied!' : <><Copy size={12}/> Copy</>}
                    </button>
                    <button 
                      onClick={downloadText}
                      className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 font-semibold"
                    >
                      <FileText size={12}/> Save TXT
                    </button>
                  </div>
                )}
              </div>
              <textarea 
                readOnly
                value={extractedText}
                placeholder="Extracted text will appear here..."
                className="flex-1 w-full p-6 text-sm text-gray-700 focus:outline-none resize-none min-h-[500px] font-mono leading-relaxed"
              />
              {extractedText && (
                <div className="border-t border-gray-100 p-3 bg-gray-50 text-xs text-gray-500 text-center">
                  {extractedText.split(/\s+/).length} words • {extractedText.length} characters
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
