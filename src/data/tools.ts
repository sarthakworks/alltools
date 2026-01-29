import { 
  FileText, Image as ImageIcon, Video, PenTool, File, 
  Merge, Scissors, Lock, Unlock, Minimize2, 
  ImagePlus, FileImage, Type, Download, Music,
  Youtube, Instagram, Twitter, Linkedin,
  EyeOff, FileCode, Eraser, ScanText
} from 'lucide-react';

export const categories = [
  { 
    id: 'pdf', name: 'PDF Tools', icon: FileText, href: '/pdf-tools',
    color: 'bg-[#6c5dd3]', lightColor: 'bg-[#f3f0ff]', 
    count: '45+ tools', desc: 'Solve Your PDF Problems',
    featured: { name: 'PDF Creator', href: '/pdf-tools/create' } 
  },
  { 
    id: 'image', name: 'Image Tools', icon: ImageIcon, href: '/image-tools',
    color: 'bg-[#ff6b2c]', lightColor: 'bg-[#fff4ed]', 
    count: '30+ tools', desc: 'Solve Your Image Problems',
    featured: { name: 'Remove BG', href: '/image-tools/remove-bg' }
  },
  { 
    id: 'video', name: 'Video Tools', icon: Video, href: '/video-tools',
    color: 'bg-[#e91e63]', lightColor: 'bg-[#fce4ec]', 
    count: '10+ tools', desc: 'Solve Your Video Problems',
    featured: { name: 'Mute Video', href: '/video-tools/mute' }
  },
  { 
    id: 'write', name: 'AI Write', icon: PenTool, href: '/ai-tools',
    color: 'bg-[#0099ff]', lightColor: 'bg-[#f0f9ff]', 
    count: '10+ tools', desc: 'Solve Your Text Problems',
    featured: { name: 'Paragraph Writer', href: '/ai-tools/writer' }
  },
  { 
    id: 'file', name: 'File Tools', icon: File, href: '/file-tools',
    color: 'bg-[#0d9488]', lightColor: 'bg-[#f0fdfa]', 
    count: '15+ tools', desc: 'Solve Your File Problems',
    featured: { name: 'Split Excel', href: '/file-tools/split-excel' }
  },
];

export const popularTools = [
  // PDF
  { name: 'Merge PDF', desc: 'Combine multiple PDFs into one', icon: Merge, href: '/pdf-tools/merge', category: 'pdf', isNew: false },
  { name: 'Split PDF', desc: 'Extract pages from your PDF', icon: Scissors, href: '/pdf-tools/split', category: 'pdf', isNew: true },
  { name: 'PDF to Image', desc: 'Convert PDF pages to JPG', icon: FileImage, href: '/pdf-tools/pdf-to-image', category: 'pdf', isNew: false },
  { name: 'Image to PDF', desc: 'Convert JPG/PNG to PDF', icon: ImagePlus, href: '/pdf-tools/image-to-pdf', category: 'pdf', isNew: false },
  { name: 'Compress PDF', desc: 'Reduce PDF file size', icon: Minimize2, href: '/pdf-tools/compress', category: 'pdf', isNew: false },
  { name: 'Unlock PDF', desc: 'Remove passwords from PDF', icon: Unlock, href: '/pdf-tools/lock-unlock', category: 'pdf', isNew: false },

  // Image
  { name: 'Compress Image', desc: 'Reduce image size without quality loss', icon: Minimize2, href: '/image-tools/compress', category: 'image', isNew: false },
  { name: 'Resize Image', desc: 'Change image dimensions', icon: ImageIcon, href: '/image-tools/resize', category: 'image', isNew: false },
  { name: 'Image to Base64', desc: 'Convert images to Base64 strings', icon: FileCode, href: '/image-tools/to-base64', category: 'image', isNew: true },
  { name: 'Blur Image', desc: 'Blur sensitive info or selected areas', icon: EyeOff, href: '/image-tools/blur', category: 'image', isNew: true },
  { name: 'Remove Background', desc: 'Auto remove image background', icon: Eraser, href: '/image-tools/remove-bg', category: 'image', isNew: true },
  { name: 'Image to Text', desc: 'Extract text via OCR', icon: ScanText, href: '/image-tools/image-to-text', category: 'image', isNew: true },
  
  // AI/Write
  { name: 'AI Writer', desc: 'Generate blog posts & emails', icon: PenTool, href: '/ai-tools/writer', category: 'write', isNew: true },
  
  // Placeholders for Video/File to fill grid
  { name: 'Youtube to Text', desc: 'Convert video to text', icon: Youtube, href: '#', category: 'video', isNew: false },
  { name: 'Instagram Download', desc: 'Save videos from Instagram', icon: Instagram, href: '#', category: 'video', isNew: false },
  { name: 'Trim Video', desc: 'Cut video segments', icon: Scissors, href: '#', category: 'video', isNew: false },
  { name: 'MP4 to MP3', desc: 'Extract audio from video', icon: Music, href: '#', category: 'video', isNew: false },
];

export const stats = [
  { value: '1m', label: 'Active Users' },
  { value: '10m', label: 'Files Converted' },
  { value: '200+', label: 'Online Tools' },
  { value: '500k', label: 'PDFs Created' },
];
