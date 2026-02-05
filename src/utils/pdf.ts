import { PDFDocument } from 'pdf-lib';

export const initPDFWorker = async () => {
  const pdfjsLib = await import('pdfjs-dist');
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    const workerSrc = '/pdf.worker.min.mjs';
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const processAndFlattenPDF = async (
  arrayBuffer: ArrayBuffer, 
  password: string = '',
  onProgress?: (progress: number) => void
): Promise<Uint8Array> => {
  // Dynamic import to avoid SSR issues
  const pdfjsLib = await import('pdfjs-dist');
  await initPDFWorker();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    password: password || undefined,
  });

  const pdfViewer = await loadingTask.promise;
  const totalPages = pdfViewer.numPages;
  const newPdf = await PDFDocument.create();

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfViewer.getPage(i);
    const scale = 2.0;
    const viewport = page.getViewport({ scale: scale }); // Render at high quality
    const originalViewport = page.getViewport({ scale: 1.0 }); // Use original dimensions for page size
    
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (context) {
      await page.render({
        canvasContext: context,
        viewport: viewport,
      } as any).promise;

      const imgDataUrl = canvas.toDataURL("image/png");
      const imgBytes = await fetch(imgDataUrl).then((res) => res.arrayBuffer());

      const img = await newPdf.embedPng(imgBytes);
      const newPage = newPdf.addPage([originalViewport.width, originalViewport.height]);
      newPage.drawImage(img, {
        x: 0,
        y: 0,
        width: originalViewport.width,
        height: originalViewport.height,
      });
    }
    if (onProgress) {
      onProgress(Math.round((i / totalPages) * 100));
    }
  }
  
  return await newPdf.save();
};

export const generatePageThumbnails = async (
  file: File, 
  onProgress?: (current: number, total: number) => void,
  scale: number = 0.5
): Promise<string[]> => {
  const pdfjsLib = await import('pdfjs-dist');
  await initPDFWorker();
  
  const arrayBuffer = await file.arrayBuffer();
  let pdf;
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    pdf = await loadingTask.promise;
  } catch (e: any) {
    if (e.name === 'PasswordException') {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, password: '' });
      pdf = await loadingTask.promise;
    } else {
      throw e;
    }
  }

  const thumbnails: string[] = [];
  for (let j = 1; j <= pdf.numPages; j++) {
    const page = await pdf.getPage(j);
    const viewport = page.getViewport({ scale: scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await page.render({
        canvasContext: context,
        viewport: viewport
      } as any).promise;
      thumbnails.push(canvas.toDataURL());
    }
    
    if (onProgress) {
      onProgress(j, pdf.numPages);
    }
  }
  return thumbnails;
};
