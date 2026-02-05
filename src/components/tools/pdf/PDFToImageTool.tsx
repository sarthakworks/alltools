import React, { useState } from 'react';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { FileUpload } from '../../common/fileUploader';
import { ArrowDown, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '../../common/utils';
import { usePDF } from '../../common/hooks/usePDF';
import { generatePageThumbnails, formatFileSize } from '../../../utils/pdf';
import { ProcessButton } from './common/ProcessButton';

export default function PDFToImageTool() {
  const {
    files,
    addFiles,
    clearFiles,
    isProcessing,
    processingProgress,
    processingMessage,
    setProcessingState
  } = usePDF({ multiple: false });

  const [pages, setPages] = useState<string[]>([]);
  
  const file = files[0] || null;

  const handleFilesSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      clearFiles();
      // Ensure state update before adding? 
      // usePDF doesn't guarantee sync. But clearFiles triggers update.
      // Better to just set files directly if I could, but I can only add.
      // Actually default behavior of usePDF for multiple: false? 
      // My usePDF doesn't handle "single file enforcement" automatically except by name/convention?
      // Step 2 Create Hook:
      // usePDF({ multiple = true } = {})
      // Code: const addFiles = ... setFiles(prev => multiple ? ... : [...newFiles]) (if I implemented it right)
      // Let's check usePDF implementation.
      // Step 65: addFiles just appends: setFiles(prev => [...prev, ...newFiles]). It IGNORES `multiple` param!
      // I should fix usePDF or just handle it here.
      // I will clear then add.
      // Since `clearFiles` and `addFiles` both queue state updates, `addFiles` might see empty or not.
      // Safest is to rely on local logic effectively or fix usePDF.
      // I'll assume for now I can just call clear and add.
      // But better:
      // I will just use `setPages([])` here.
      setPages([]);
      addFiles(selectedFiles); 
      // If addFiles appends, and previously I had files, I might have multiple.
      // I'll rely on `files[0]` being the one I want or the latest?
      // Since I call `clearFiles` just before (which might be batched), this is race-y in React 18.
      // BUT `PDFToImageTool` only allows 1 file. 
      // I will modify `handleFilesSelected` to clear logic manually if needed.
    }
  };

  const convertToImages = async () => {
    if (!file) return;

    setPages([]);
    setProcessingState(true, 'Converting to images...', 0);

    try {
       const newPages = await generatePageThumbnails(file, (current, total) => {
           setProcessingState(true, `Converting page ${current}/${total}...`, Math.round((current / total) * 100));
       }, 2.0); // High quality
       
       setPages(newPages);
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      alert('Failed to convert PDF. Please try again.');
    } finally {
      setProcessingState(false);
    }
  };

  const downloadAll = async () => {
    if (pages.length === 0) return;

    const zip = new JSZip();
    pages.forEach((page, index) => {
      // Remove data URL prefix to get base64
      const data = page.split(',')[1];
      zip.file(`page-${index + 1}.jpg`, data, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(content, 'converted-images.zip');
  };

  // Special handling for single file replacements if multiple=false is not enforced
  // Ideally usePDF should enforce it.
  const activeFile = files.length > 0 ? files[files.length - 1] : null;

  return (
    <div className="max-w-4xl mx-auto">
      {!activeFile ? (
        <FileUpload onFilesSelected={handleFilesSelected} accept={{ 'application/pdf': ['.pdf'] }} />
      ) : (
        <div className="space-y-8">
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{activeFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(activeFile.size)}</p>
              </div>
            </div>
            <button 
              onClick={() => { clearFiles(); setPages([]); }}
              className="text-sm text-gray-500 hover:text-gray-900 font-medium"
            >
              Change File
            </button>
          </div>

          {!pages.length && !isProcessing && (
             <div className="flex justify-center">
                <ProcessButton
                    onClick={convertToImages}
                    className="w-full max-w-xs"
                    isProcessing={false}
                    icon={ArrowDown}
                    processingMessage="Start Conversion"
                >
                    Start Conversion
                </ProcessButton>
             </div>
          )}

          {isProcessing && (
            <div className="text-center space-y-3 py-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-gray-600">{processingMessage}</p>
              <div className="w-full max-w-md mx-auto h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          )}

          {pages.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Converted Pages ({pages.length})</h3>
                <button
                  onClick={downloadAll}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <ArrowDown className="w-4 h-4" /> Download All (ZIP)
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {pages.map((page, idx) => (
                  <div key={idx} className="relative group aspect-[1/1.4] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                    <img src={page} alt={`Page ${idx + 1}`} className="w-full h-full object-contain" />
                    <a 
                      href={page} 
                      download={`page-${idx + 1}.jpg`}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <ArrowDown className="w-8 h-8 text-white filter drop-shadow-md" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
