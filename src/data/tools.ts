
import { 
  FileText, Image as ImageIcon, Video, PenTool,
  Merge, Scissors, Lock, Minimize2, 
  ImagePlus, FileImage, 
  EyeOff, FileCode, ScanText, Sparkles,
  Image as LucideImage, ArrowRightLeft, Maximize2, GitCompare, AlignLeft
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
  search_keys?: string;  // Comma-separated keywords for better search matching
}

export const allTools: ToolMetadata[] = [
  // PDF Tools
  { id: 'merge-pdf', name: 'Organise and Merge PDF', desc: 'Combine multiple PDFs into one', icon: Merge, href: '/pdf-tools/merge', category: 'pdf', color: 'bg-red-50 text-red-600', search_keys: 'organize, organise pdf, combine, join, concatenate, unite, mgre, merg, append' },
  { id: 'split-pdf', name: 'Split PDF', desc: 'Extract pages from your PDF', icon: Scissors, href: '/pdf-tools/split', category: 'pdf', isNew: true, color: 'bg-purple-50 text-purple-600', search_keys: 'divide, separate, extract, cut, break, splt' },
  { id: 'pdf-to-image', name: 'PDF to Image', desc: 'Convert PDF pages to JPG/PNG', icon: FileImage, href: '/pdf-tools/to-image', category: 'pdf', color: 'bg-orange-50 text-orange-600', search_keys: 'convert, transform, export, jpg, jpeg, png, picture' },
  { id: 'image-to-pdf', name: 'Image to PDF', desc: 'Convert JPG/PNG to PDF', icon: ImagePlus, href: '/pdf-tools/image-to-pdf', category: 'pdf', color: 'bg-blue-50 text-blue-600', search_keys: 'convert, transform, import, jpg, jpeg, png, picture' },
  { id: 'compress-pdf', name: 'Compress PDF', desc: 'Reduce PDF file size', icon: Minimize2, href: '/pdf-tools/compress', category: 'pdf', color: 'bg-green-50 text-green-600', search_keys: 'reduce, shrink, minimize, optimize, smaller, compres' },
  { id: 'lock-unlock-pdf', name: 'Lock / Unlock PDF', desc: 'Add or remove PDF protections', icon: Lock, href: '/pdf-tools/lock-unlock', category: 'pdf', color: 'bg-indigo-50 text-indigo-600', search_keys: 'password, protect, secure, unlock, decrypt, encrypt' },

  // Image Tools
  { id: 'compress-image', name: 'Compress Image', desc: 'Reduce image file size', icon: Minimize2, href: '/image-tools/compress', category: 'image', color: 'bg-blue-50 text-blue-600', search_keys: 'reduce, shrink, minimize, optimize, smaller, compres' },
  { id: 'resize-image', name: 'Resize Image', desc: 'Change image dimensions', icon: LucideImage, href: '/image-tools/resize', category: 'image', color: 'bg-indigo-50 text-indigo-600', search_keys: 'scale, dimensions, width, height, crop, rsiz' },
  { id: 'image-to-base64', name: 'Image to Base64', desc: 'Convert images to Base64 strings', icon: FileCode, href: '/image-tools/to-base64', category: 'image', isNew: true, color: 'bg-purple-50 text-purple-600', search_keys: 'encode, convert, base64, data url, base 64' },
  { id: 'blur-image', name: 'Blur & Redact', desc: 'Hide sensitive info with blur', icon: EyeOff, href: '/image-tools/blur', category: 'image', isNew: true, color: 'bg-pink-50 text-pink-600', search_keys: 'redact, censor, hide, privacy, sensitive, blur' },
  { id: 'remove-bg', name: 'Remove Background', desc: 'AI-powered background removal', icon: Sparkles, href: '/image-tools/remove-bg', category: 'image', isNew: true, color: 'bg-green-50 text-green-600', search_keys: 'background, transparent, cutout, ai, remove, bg, background remover' },
  { id: 'image-ocr', name: 'Image to Text (OCR)', desc: 'Extract text from images', icon: ScanText, href: '/image-tools/image-to-text', category: 'image', isNew: true, color: 'bg-orange-50 text-orange-600', search_keys: 'ocr, text recognition, extract, scan, read, optical character' },

  // AI Tools
  { id: 'ai-writer', name: 'AI Writer', desc: 'Generate blog posts & emails with AI', icon: PenTool, href: '/ai-tools/writer', category: 'ai', isNew: true, color: 'bg-purple-50 text-purple-600', search_keys: 'write, generate, content, blog, email, article, gpt, chatgpt' },
  { id: 'essay-writer', name: 'Essay Writer', desc: 'Write academic essays offline', icon: FileText, href: '/ai-tools/essay-writer', category: 'ai', isNew: true, color: 'bg-indigo-50 text-indigo-600', search_keys: 'essay, academic, write, offline, paper, thesis' },
  { id: 'image-gen', name: 'Image Generator', desc: 'Create AI art from text prompts', icon: ImageIcon, href: '/ai-tools/image-generator', category: 'ai', isNew: true, color: 'bg-pink-50 text-pink-600', search_keys: 'ai art, generate, create, dall-e, midjourney, stable diffusion, art' },

  // Coding Tools
  { id: 'json-formatter', name: 'JSON Formatter', desc: 'Beautify & Validate JSON', icon: FileCode, href: '/coding-tools/json-formatter', category: 'coding', isNew: true, color: 'bg-teal-50 text-teal-600', search_keys: 'beautify, format, validate, prettify, json, formater' },
  { id: 'html-formatter', name: 'HTML Formatter', desc: 'Beautify HTML Code', icon: FileCode, href: '/coding-tools/html-formatter', category: 'coding', isNew: true, color: 'bg-orange-50 text-orange-600', search_keys: 'beautify, format, prettify, html, formater' },
  { id: 'sass-to-css', name: 'Sass to CSS', desc: 'Compile Sass/SCSS to CSS', icon: FileCode, href: '/coding-tools/sass-to-css', category: 'coding', isNew: true, color: 'bg-pink-50 text-pink-600', search_keys: 'compile, convert, sass, scss, css, preprocessor' },
  { id: 'xml-to-json', name: 'XML <-> JSON', desc: 'Convert XML to JSON & vice versa', icon: ArrowRightLeft, href: '/coding-tools/xml-to-json', category: 'coding', isNew: true, color: 'bg-purple-50 text-purple-600', search_keys: 'convert, transform, xml, json, parse' },
  { id: 'css-formatter', name: 'CSS Formatter', desc: 'Beautify CSS/SCSS/Less', icon: AlignLeft, href: '/coding-tools/css-formatter', category: 'coding', isNew: true, color: 'bg-blue-50 text-blue-600', search_keys: 'beautify, format, prettify, css, scss, less, formater' },
  { id: 'json-to-js', name: 'JSON to JS Object', desc: 'Convert JSON to JS Object', icon: FileCode, href: '/coding-tools/json-to-js', category: 'coding', isNew: true, color: 'bg-emerald-50 text-emerald-600', search_keys: 'convert, transform, json, javascript, object' },
  { id: 'unminifier', name: 'Universal Unminifier', desc: 'Unminify JS, CSS, HTML, JSON', icon: Maximize2, href: '/coding-tools/unminifier', category: 'coding', isNew: true, color: 'bg-indigo-50 text-indigo-600', search_keys: 'unminify, beautify, prettify, format, deobfuscate' },
  { id: 'diff-checker', name: 'Diff Checker', desc: 'Compare text differences', icon: GitCompare, href: '/coding-tools/diff-checker', category: 'coding', isNew: true, color: 'bg-cyan-50 text-cyan-600', search_keys: 'compare, diff, difference, merge, git' },

  // Misc Tools
  { id: 'aes-encrypt', name: 'AES Encryption', desc: 'Encrypt & Decrypt text using AES', icon: Lock, href: '/misc-tools/aes-encryption', category: 'misc', color: 'bg-red-50 text-red-600', search_keys: 'encrypt, decrypt, security, aes, cipher, crypto' },
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
    id: 'misc', name: 'Misc Tools', icon: Video, href: '/misc-tools',
    color: 'bg-[#e91e63]', lightColor: 'bg-[#fce4ec]', 
    count: '10+ tools', desc: 'Solve Your misc Problems',
    featured: { name: 'Mute misc', href: '/misc-tools/mute' }
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

