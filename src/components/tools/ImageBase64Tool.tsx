import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileCode, Download, Copy, RefreshCw, Upload, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../../i18n';

export default function ImageBase64Tool() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'encode' | 'decode'>('encode');
  const [image, setImage] = useState<string | null>(null);
  const [base64, setBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // ENCODE: Image -> Base64
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setLoading(true);
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImage(result); // Preview
        setBase64(result);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  // DECODE: Base64 -> Image
  const handleDecode = () => {
    if (!base64.trim()) return;
    setImage(base64); // Simple as setting it as src
  };

  const handleCopy = async () => {
     try {
       await navigator.clipboard.writeText(base64);
       setCopySuccess(true);
       setTimeout(() => setCopySuccess(false), 2000);
     } catch (err) {
       console.error('Failed to copy!', err);
     }
  };

  // Utility to format long strings
  const truncate = (str: string, len = 50) => str.length > len ? str.substring(0, len) + '...' : str;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-8 w-fit mx-auto">
        <button 
          onClick={() => setActiveTab('encode')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'encode' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('tools_ui.image_base64.encode_tab')}
        </button>
        <button 
          onClick={() => setActiveTab('decode')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'decode' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('tools_ui.image_base64.decode_tab')}
        </button>
      </div>

      {activeTab === 'encode' && (
        <div className="grid md:grid-cols-2 gap-8">
            {/* Input Side */}
            <div className="space-y-4">
                 <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors h-64 flex flex-col items-center justify-center
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                    <input {...getInputProps()} />
                    <div className="bg-blue-100 p-4 rounded-full text-blue-600 mb-4">
                        <Upload size={32} />
                    </div>
                    <p className="font-semibold text-gray-700">{t('tools_ui.image_base64.drop_label')}</p>
                    <p className="text-xs text-gray-400 mt-2">{t('tools_ui.image_base64.formats')}</p>
                </div>
                
                {image && (
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <img src={image} alt="Preview" className="w-16 h-16 object-cover rounded-lg bg-gray-100" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{fileName}</p>
                            <p className="text-xs text-gray-400">{(base64.length / 1024).toFixed(1)} KB Base64</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Output Side */}
            <div className="flex flex-col h-full bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-white border-b border-gray-200 p-3 px-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('tools_ui.image_base64.output_label')}</span>
                    {base64 && (
                    <button 
                        onClick={handleCopy}
                        className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${copySuccess ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {copySuccess ? <span className="flex items-center gap-1">{t('tools_ui.image_base64.copied')}</span> : <><Copy size={12}/> {t('tools_ui.image_base64.copy')}</>}
                    </button>
                    )}
                </div>
                <textarea 
                    readOnly
                    value={base64}
                    placeholder={t('tools_ui.image_base64.placeholder_output')}
                    className="flex-1 w-full bg-transparent p-4 text-xs font-mono text-gray-600 focus:outline-none resize-none min-h-50"
                />
            </div>
        </div>
      )}

      {activeTab === 'decode' && (
        <div className="grid md:grid-cols-2 gap-8">
             {/* Input Side */}
             <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                 <div className="bg-gray-50 border-b border-gray-200 p-3 px-4">
                     <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('tools_ui.image_base64.paste_label')}</span>
                 </div>
                 <textarea 
                     value={base64}
                     onChange={(e) => setBase64(e.target.value)}
                     placeholder={t('tools_ui.image_base64.placeholder_input')}
                     className="flex-1 w-full p-4 text-xs font-mono text-gray-700 focus:outline-none focus:bg-blue-50/20 resize-none min-h-75"
                 />
                 <div className="p-3 border-t border-gray-100 bg-gray-50 text-right">
                     <button 
                        onClick={handleDecode}
                        disabled={!base64}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors"
                     >
                         {t('tools_ui.image_base64.decode_button')}
                     </button>
                 </div>
             </div>

             {/* Preview Side */}
             <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-2xl border border-dashed border-gray-300 min-h-75">
                 {image ? (
                    <div className="text-center relative">
                        <img src={image} alt="Decoded" className="max-w-full max-h-75 object-contain rounded-lg shadow-lg" />
                        <a href={image} download="decoded-image.png" className="mt-4 bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm inline-flex items-center gap-2 hover:bg-gray-50">
                            <Download size={16} /> Download
                        </a>
                    </div>
                 ) : (
                    <div className="text-center text-gray-400">
                        <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{t('tools_ui.image_base64.preview_placeholder')}</p>
                    </div>
                 )}
             </div>
        </div>
      )}

    </div>
  );
}
