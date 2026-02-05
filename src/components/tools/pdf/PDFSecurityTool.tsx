import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileUpload } from '../../common/fileUploader';
import { Lock, Unlock, Download, ShieldCheck, ShieldAlert, X, CheckCircle as CheckCircleIcon, Eye, EyeOff } from 'lucide-react';
import FileSaver from 'file-saver';
import { usePDF } from '../../common/hooks/usePDF';
import { initPDFWorker, formatFileSize, processAndFlattenPDF } from '../../../utils/pdf';
import { ProcessButton } from './common/ProcessButton';

type Tab = 'lock' | 'unlock';

export default function PDFSecurityTool() {
  const {
    files,
    addFiles,
    clearFiles,
    isProcessing,
    processingProgress,
    processingMessage,
    setProcessingState
  } = usePDF({ multiple: false });

  const [activeTab, setActiveTab] = useState<Tab>('lock');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility
  const [processedFile, setProcessedFile] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useForceMode, setUseForceMode] = useState(true);

  const file = files[0] || null;

  const handleFilesSelected = (selectedFiles: File[]) => {
    addFiles(selectedFiles);
    setProcessedFile(null);
    setError(null);
    setPassword('');
    setUseForceMode(true);
  };

  const processPDF = async () => {
    if (!file || !password) return;
    setProcessingState(true, activeTab === 'lock' ? 'Encrypting...' : 'Decrypting...');
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();

      if (activeTab === 'lock') {
        try {
             // @ts-ignore
             const { encryptPDF } = await import('@pdfsmaller/pdf-encrypt-lite');
             
             const encryptedBytes = await encryptPDF(
                new Uint8Array(arrayBuffer),
                password,
                password
             );

            setProcessedFile(new Blob([encryptedBytes as any], { type: 'application/pdf' }));
        } catch (e: any) {
            if (e.message && e.message.includes('Encrypted')) {
                throw new Error("This PDF is already encrypted. Please unlock it first.");
            }
            throw e;
        }
      } else {
        if (useForceMode) {
             const pdfBytes = await processAndFlattenPDF(arrayBuffer, password, (progress) => {
                 setProcessingState(true, `Processing...`, progress);
             });
             setProcessedFile(new Blob([pdfBytes as any], { type: 'application/pdf' }));
        } else {
             try {
                const pdfDoc = await PDFDocument.load(arrayBuffer, { password, ignoreEncryption: false } as any);
                const pdfBytes = await pdfDoc.save();
                setProcessedFile(new Blob([pdfBytes as any], { type: 'application/pdf' }));
            } catch (e: any) {
                 console.error("Unlock failed:", e);
                 
                 if (e.message && e.message.toLowerCase().includes('password')) {
                     throw new Error("Incorrect password. Please try again.");
                 }
                 
                 if (e.message && (e.message.includes('Unsupported') || e.message.includes('Encrypted'))) {
                     throw new Error("This PDF uses advanced encryption. Please try checking 'Force Unlock (Flatten PDF)' below.");
                 }
    
                 throw new Error(`Unlock failed: ${e.message}`);
            }
        }
      }
    } catch (err: any) {
      console.error("Security operation failed:", err);
      setError(err.message || "Operation failed. Please try a different file.");
    } finally {
      setProcessingState(false);
    }
  };

  const downloadFile = () => {
    if (processedFile && file) {
      const prefix = activeTab === 'lock' ? 'protected' : 'unlocked';
      FileSaver.saveAs(processedFile, `${prefix}-${file.name}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex">
          <button
            onClick={() => { setActiveTab('lock'); clearFiles(); setProcessedFile(null); }}
            className={`px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'lock' 
                ? 'bg-rose-50 text-rose-700 shadow-sm ring-1 ring-rose-200' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Lock className="w-4 h-4" /> Lock PDF
          </button>
          <button
            onClick={() => { setActiveTab('unlock'); clearFiles(); setProcessedFile(null); }}
            className={`px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'unlock' 
                ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Unlock className="w-4 h-4" /> Unlock PDF
          </button>
        </div>
      </div>

      {!file ? (
        <FileUpload 
            onFilesSelected={handleFilesSelected} 
            accept={{ 'application/pdf': ['.pdf'] }} 
        />
      ) : (
        <div className="space-y-8">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-3">
                    {activeTab === 'lock' ? <ShieldAlert className="w-5 h-5 text-rose-500" /> : <ShieldCheck className="w-5 h-5 text-emerald-500" />}
                    <div>
                        <span className="text-sm font-medium text-gray-700 block">{file.name}</span>
                        <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
                    </div>
                </div>
                <button 
                    onClick={() => { clearFiles(); setProcessedFile(null); }}
                    className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {!processedFile ? (
                <div className="max-w-md mx-auto space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {activeTab === 'lock' ? 'Set Password' : 'Enter Password'}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={activeTab === 'lock' ? "Enter a strong password" : "Enter the PDF password"}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                         {error && (
                            <div className="text-rose-500 text-sm mt-2 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> {error}
                            </div>
                        )}
                    </div>

                    {activeTab === 'unlock' && (
                        <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="force-mode"
                                checked={useForceMode}
                                onChange={(e) => setUseForceMode(e.target.checked)}
                                className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="force-mode" className="text-sm text-gray-700 cursor-pointer">
                                <span className="font-semibold block text-gray-900">Force Unlock (Flatten PDF)</span>
                                <span className="text-gray-500">Enable this if regular unlocking fails (e.g. for Aadhaar or Bank Statements). Converts pages to images.</span>
                            </label>
                        </div>
                    )}

                    <ProcessButton
                        onClick={processPDF}
                        disabled={!password}
                        isProcessing={isProcessing}
                        progress={processingProgress}
                        processingMessage={processingMessage}
                        className={activeTab === 'lock' 
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                        }
                        icon={activeTab === 'lock' ? Lock : Unlock}
                    >
                        {activeTab === 'lock' ? 'Protect PDF' : 'Unlock PDF'}
                    </ProcessButton>
                </div>
            ) : (
                <div className="text-center py-8">
                     <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircleIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {activeTab === 'lock' ? 'File Protected!' : 'File Unlocked!'}
                    </h3>
                    <p className="text-gray-500 mb-8">
                        Your file is ready for download.
                    </p>
                    
                    <button
                        onClick={downloadFile}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 mx-auto transition-all"
                    >
                        <Download className="w-5 h-5" />
                        Download {activeTab === 'lock' ? 'Protected' : 'Unlocked'} PDF
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
