import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileUpload } from '../../common/fileUploader';
import { ArrowDown, FileText, Minimize2, CheckCircle, X } from 'lucide-react';
import FileSaver from 'file-saver';
import { usePDF } from '../../common/hooks/usePDF';
import { initPDFWorker, formatFileSize } from '../../../utils/pdf';
import { ProcessButton } from './common/ProcessButton';

export default function PDFCompressTool() {
  const { 
    files, 
    addFiles, 
    clearFiles, 
    isProcessing, 
    processingProgress,
    processingMessage,
    setProcessingState 
  } = usePDF({ multiple: false });

  const [compressionLevel, setCompressionLevel] = useState<number>(0.7); // 0.7 = Recommended
  const [processedFile, setProcessedFile] = useState<{ blob: Blob; size: number } | null>(null);

  const file = files[0] || null;

  const handleFilesSelected = (selectedFiles: File[]) => {
    addFiles(selectedFiles);
    setProcessedFile(null);
  };

  const compressPDF = async () => {
    if (!file) return;
    setProcessingState(true, 'Compressing...');

    try {
      // 1. Process PDF using pdfjs-dist (client-side re-distilling)
      const pdfjsLib = await import('pdfjs-dist');
      await initPDFWorker();

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      // 2. Create new PDF with pdf-lib
      const newPdf = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 }); // Reasonable scale for readable docs
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport
          } as any).promise;

          // Compression happens here at image encoding level
          const imgDataUrl = canvas.toDataURL('image/jpeg', compressionLevel);
          const imgBytes = await fetch(imgDataUrl).then(res => res.arrayBuffer());
          
          const jpgImage = await newPdf.embedJpg(imgBytes);
          const newPage = newPdf.addPage([viewport.width, viewport.height]);
          newPage.drawImage(jpgImage, {
            x: 0,
            y: 0,
            width: viewport.width,
            height: viewport.height,
          });
        }

        setProcessingState(true, 'Compressing...', Math.round((i / totalPages) * 100));
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      setProcessedFile({ blob, size: blob.size });

    } catch (error: any) {
      console.error("Compression failed:", error);
      alert(`Compression failed: ${error.message}`);
    } finally {
      setProcessingState(false);
    }
  };

  const downloadFile = () => {
    if (processedFile) {
      FileSaver.saveAs(processedFile.blob, `compressed-${file?.name || 'document.pdf'}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {!file ? (
        <FileUpload onFilesSelected={handleFilesSelected} accept={{ 'application/pdf': ['.pdf'] }} />
      ) : (
        <div className="space-y-8">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-red-500" />
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
                <div className="space-y-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Compression Level</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Extreme', value: 0.4, desc: 'Low quality, smallest size' },
                                { label: 'Recommended', value: 0.7, desc: 'Good quality, good compression' },
                                { label: 'High Quality', value: 0.9, desc: 'Best quality, larger size' }
                            ].map((level) => (
                                <button
                                    key={level.label}
                                    onClick={() => setCompressionLevel(level.value)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                                        compressionLevel === level.value 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="font-bold text-gray-900">{level.label}</div>
                                    <div className="text-xs text-gray-500 mt-1">{level.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <ProcessButton
                        onClick={compressPDF}
                        isProcessing={isProcessing}
                        progress={processingProgress}
                        processingMessage={processingMessage}
                        icon={Minimize2}
                    >
                        Compress PDF
                    </ProcessButton>
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Compression Complete!</h3>
                    <p className="text-gray-500 mb-8">
                        Your file has been compressed from <span className="font-medium text-gray-900">{formatFileSize(file.size)}</span> to <span className="font-bold text-green-600">{formatFileSize(processedFile.size)}</span>
                    </p>
                    
                    <button
                        onClick={downloadFile}
                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 flex items-center gap-2 mx-auto transition-all"
                    >
                        <ArrowDown className="w-5 h-5" />
                        Download Compressed PDF
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
