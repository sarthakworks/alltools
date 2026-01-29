import { 
  FileText, Image as ImageIcon, Video, PenTool,
  Merge, Scissors, Lock, Minimize2, 
  ImagePlus, FileImage, 
  EyeOff, FileCode, ScanText, Sparkles,
 Image as LucideImage
} from 'lucide-react';

export interface ToolMetadata {
  id: string;
  name: string;
  desc: string;
  icon: any;
  href: string;
  category: string;
  isNew?: boolean;
  featured?: boolean;
  color?: string;
}

export const allTools: ToolMetadata[] = [
  // PDF Tools
  { id: 'merge-pdf', name: 'Merge PDF', desc: 'Combine multiple PDFs into one', icon: Merge, href: '/pdf-tools/merge', category: 'pdf', color: 'bg-red-50 text-red-600' },
  { id: 'split-pdf', name: 'Split PDF', desc: 'Extract pages from your PDF', icon: Scissors, href: '/pdf-tools/split', category: 'pdf', isNew: true, color: 'bg-purple-50 text-purple-600' },
  { id: 'pdf-to-image', name: 'PDF to Image', desc: 'Convert PDF pages to JPG/PNG', icon: FileImage, href: '/pdf-tools/to-image', category: 'pdf', color: 'bg-orange-50 text-orange-600' },
  { id: 'image-to-pdf', name: 'Image to PDF', desc: 'Convert JPG/PNG to PDF', icon: ImagePlus, href: '/pdf-tools/image-to-pdf', category: 'pdf', color: 'bg-blue-50 text-blue-600' },
  { id: 'compress-pdf', name: 'Compress PDF', desc: 'Reduce PDF file size', icon: Minimize2, href: '/pdf-tools/compress', category: 'pdf', color: 'bg-green-50 text-green-600' },
  { id: 'lock-unlock-pdf', name: 'Lock / Unlock PDF', desc: 'Add or remove PDF protections', icon: Lock, href: '/pdf-tools/lock-unlock', category: 'pdf', color: 'bg-indigo-50 text-indigo-600' },

  // Image Tools
  { id: 'compress-image', name: 'Compress Image', desc: 'Reduce image file size', icon: Minimize2, href: '/image-tools/compress', category: 'image', color: 'bg-blue-50 text-blue-600' },
  { id: 'resize-image', name: 'Resize Image', desc: 'Change image dimensions', icon: LucideImage, href: '/image-tools/resize', category: 'image', color: 'bg-indigo-50 text-indigo-600' },
  { id: 'image-to-base64', name: 'Image to Base64', desc: 'Convert images to Base64 strings', icon: FileCode, href: '/image-tools/to-base64', category: 'image', isNew: true, color: 'bg-purple-50 text-purple-600' },
  { id: 'blur-image', name: 'Blur & Redact', desc: 'Hide sensitive info with blur', icon: EyeOff, href: '/image-tools/blur', category: 'image', isNew: true, color: 'bg-pink-50 text-pink-600' },
  { id: 'remove-bg', name: 'Remove Background', desc: 'AI-powered background removal', icon: Sparkles, href: '/image-tools/remove-bg', category: 'image', isNew: true, color: 'bg-green-50 text-green-600' },
  { id: 'image-ocr', name: 'Image to Text (OCR)', desc: 'Extract text from images', icon: ScanText, href: '/image-tools/image-to-text', category: 'image', isNew: true, color: 'bg-orange-50 text-orange-600' },

  // AI Tools
  { id: 'ai-writer', name: 'AI Writer', desc: 'Generate blog posts & emails with AI', icon: PenTool, href: '/ai-tools/writer', category: 'ai', isNew: true, color: 'bg-purple-50 text-purple-600' },
  { id: 'essay-writer', name: 'Essay Writer', desc: 'Write academic essays offline', icon: FileText, href: '/ai-tools/essay-writer', category: 'ai', isNew: true, color: 'bg-indigo-50 text-indigo-600' },
  { id: 'image-gen', name: 'Image Generator', desc: 'Create AI art from text prompts', icon: ImageIcon, href: '/ai-tools/image-generator', category: 'ai', isNew: true, color: 'bg-pink-50 text-pink-600' },
];

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
    id: 'ai', name: 'AI Tools', icon: PenTool, href: '/ai-tools',
    color: 'bg-[#0099ff]', lightColor: 'bg-[#f0f9ff]', 
    count: '10+ tools', desc: 'Solve Your Text Problems',
    featured: { name: 'Paragraph Writer', href: '/ai-tools/writer' }
  },
  { 
    id: 'coding', name: 'Coding Tools', icon: FileCode, href: '/coding-tools',
    color: 'bg-[#0d9488]', lightColor: 'bg-[#f0fdfa]', 
    count: '15+ tools', desc: 'Solve Your Coding Problems',
    featured: { name: 'JSON Formatter', href: '/coding-tools/json-formatter' }
  },
];

export const popularTools = allTools.filter(t => t.isNew || t.featured || ['merge-pdf', 'split-pdf', 'compress-pdf', 'compress-image', 'remove-bg'].includes(t.id));

export const stats = [
  { value: '1m', label: 'Active Users' },
  { value: '10m', label: 'Files Converted' },
  { value: '200+', label: 'Online Tools' },
  { value: '500k', label: 'PDFs Created' },
];

