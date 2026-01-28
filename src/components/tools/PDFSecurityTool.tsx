import React, { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { FileUpload } from '../ui/file-uploader';
import { Lock, Unlock, FileText, Loader2, Download, ShieldCheck, ShieldAlert, X } from 'lucide-react';
import FileSaver from 'file-saver';

type Tab = 'lock' | 'unlock';

export default function PDFSecurityTool() {
  const [activeTab, setActiveTab] = useState<Tab>('lock');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setProcessedFile(null);
      setError(null);
      setPassword('');
    }
  };

  const processPDF = async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();

      if (activeTab === 'lock') {
        // LOCK PDF
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        // Save with encryption
        const pdfBytes = await pdfDoc.save({
            userPassword: password,
            ownerPassword: password,
            permissions: {
                printing: true,
                modifying: false,
                copying: false,
                annotating: false,
                fillingForms: false,
                contentAccessibility: false,
                documentAssembly: false,
            }
        });
        setProcessedFile(new Blob([pdfBytes], { type: 'application/pdf' }));
      } else {
        // UNLOCK PDF
        // Note: pdf-lib requires the password to load the doc if encrypted
        try {
            // Fix: Create correct options object
            const pdfDoc = await PDFDocument.load(arrayBuffer, { password, ignoreEncryption: false });
            const pdfBytes = await pdfDoc.save(); // Saving without encryption removes it
            setProcessedFile(new Blob([pdfBytes], { type: 'application/pdf' }));
        } catch (e) {
            throw new Error("Incorrect password or file not encrypted.");
        }
      }
    } catch (err: any) {
      console.error("Security operation failed:", err);
      setError(err.message || "Operation failed");
    } finally {
      setIsProcessing(false);
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
            onClick={() => { setActiveTab('lock'); setFile(null); setProcessedFile(null); }}
            className={`px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'lock' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Lock className="w-4 h-4" /> Lock PDF
          </button>
          <button
            onClick={() => { setActiveTab('unlock'); setFile(null); setProcessedFile(null); }}
            className={`px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'unlock' ? 'bg-green-50 text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
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
                    {activeTab === 'lock' ? <ShieldAlert className="w-5 h-5 text-red-500" /> : <ShieldCheck className="w-5 h-5 text-green-500" />}
                    <div>
                        <span className="text-sm font-medium text-gray-700 block">{file.name}</span>
                        <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                </div>
                <button 
                    onClick={() => { setFile(null); setProcessedFile(null); }}
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
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={activeTab === 'lock' ? "Enter a strong password" : "Enter the PDF password"}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                         {error && (
                            <div className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> {error}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={processPDF}
                        disabled={!password || isProcessing}
                        className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                            activeTab === 'lock' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-green-600 hover:bg-green-700 shadow-green-500/20'
                        } text-white`}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {activeTab === 'lock' ? 'Encrypting...' : 'Decrypting...'}
                            </>
                        ) : (
                            <>
                                {activeTab === 'lock' ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                                {activeTab === 'lock' ? 'Protect PDF' : 'Unlock PDF'}
                            </>
                        )}
                    </button>
                </div>
            ) : (
                <div className="text-center py-8">
                     <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8" />
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

// Helper icon
function CheckCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    );
}
