import React, { useState } from 'react';
import { Upload, Copy, FileText, Loader2, Languages } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { FileUpload } from '../ui/file-uploader';
import { useTranslation } from 'react-i18next';
import '../../i18n';

export default function ImageOCRTool() {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState('eng');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setExtractedText('');
      };
      reader.readAsDataURL(files[0]);
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
      alert(t('tools_ui.image_ocr.error_alert'));
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
        <FileUpload
          onFilesSelected={handleFilesSelected}
          accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] }}
          multiple={false}
          title={t('tools_ui.image_ocr.upload_title')}
        />
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <button onClick={() => window.location.reload()} className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              ← {t('tools_ui.image_blur.upload_new')}
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
                    {progress > 0 ? `${progress}%` : t('tools_ui.image_ocr.loading')}
                  </>
                ) : (
                  <>
                    <FileText size={18} />
                    {t('tools_ui.image_ocr.extract_button')}
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
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('tools_ui.image_ocr.image_label')}</span>
              </div>
              <div className="p-6 bg-gray-50 flex items-center justify-center min-h-125">
                <img src={image} alt="Upload" className="max-w-full max-h-125 object-contain rounded-lg border border-gray-200 bg-white" />
              </div>
            </div>

            {/* Extracted Text */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
              <div className="bg-green-50 border-b border-green-200 p-3 px-4 flex justify-between items-center">
                <span className="text-xs font-bold text-green-600 uppercase tracking-wide">{t('tools_ui.image_ocr.extracted_label')}</span>
                {extractedText && (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCopy}
                      className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors font-semibold ${copySuccess ? 'bg-green-100 text-green-700' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
                    >
                      {copySuccess ? t('tools_ui.image_base64.copied') : <><Copy size={12}/> {t('tools_ui.image_base64.copy')}</>}
                    </button>
                    <button 
                      onClick={downloadText}
                      className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 font-semibold"
                    >
                      <FileText size={12}/> {t('tools_ui.image_ocr.save_txt')}
                    </button>
                  </div>
                )}
              </div>
              <textarea 
                readOnly
                value={extractedText}
                placeholder={t('tools_ui.image_ocr.placeholder')}
                className="flex-1 w-full p-6 text-sm text-gray-700 focus:outline-none resize-none min-h-125 font-mono leading-relaxed"
              />
              {extractedText && (
                <div className="border-t border-gray-100 p-3 bg-gray-50 text-xs text-gray-500 text-center">
                  {extractedText.split(/\s+/).length} {t('tools_ui.image_ocr.words')} • {extractedText.length} {t('tools_ui.image_ocr.chars')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
