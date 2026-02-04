import React from 'react';
import { useTranslation } from 'react-i18next';
import { Linkedin } from 'lucide-react';
import '../i18n';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 text-sm">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1 lg:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-command"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">{t('hero.title')}</span>
            </a>
            <p className="text-gray-500 mb-6 leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="flex items-center gap-1 text-xs font-semibold text-gray-400">
               <div className="bg-blue-600 text-white p-1 rounded">S</div>
               <span>Sarthak Bansal</span>
            </div>
          </div>

          {/* Navigate */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">{t('footer.navigate')}</h3>
            <ul className="space-y-3 text-gray-500">
              <li><a href="/" className="hover:text-blue-600 transition-colors">{t('nav.home')}</a></li>
              <li><a href="/privacy" className="hover:text-blue-600 transition-colors">{t('nav.privacy')}</a></li>
              <li><a href="/tos" className="hover:text-blue-600 transition-colors">{t('nav.tos')}</a></li>
              <li><a href="/contact" className="hover:text-blue-600 transition-colors">{t('nav.contact')}</a></li>
              <li><a href="/blog" className="hover:text-blue-600 transition-colors">{t('nav.blog')}</a></li>
              <li><a href="/about" className="hover:text-blue-600 transition-colors">{t('nav.about')}</a></li>
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">{t('footer.tools')}</h3>
            <ul className="space-y-3 text-gray-500">
              <li><a href="/ai-tools/essay-writer" className="hover:text-blue-600 transition-colors">{t('tools_data.essay-writer.name', { defaultValue: 'Essay Writer' })}</a></li>
              <li><a href="/image-tools/remove-bg" className="hover:text-blue-600 transition-colors">{t('tools_data.remove-bg.name', { defaultValue: 'Remove Background' })}</a></li>
              <li><a href="/ai-tools/writer" className="hover:text-blue-600 transition-colors">{t('tools_data.ai-writer.name', { defaultValue: 'AI Writer' })}</a></li>
              <li><a href="/ai-tools/image-generator" className="hover:text-blue-600 transition-colors">{t('tools_data.image-gen.name', { defaultValue: 'Image Generator' })}</a></li>
            </ul>
          </div>

          {/* PDF Tools */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">{t('footer.pdf_tools')}</h3>
            <ul className="space-y-3 text-gray-500">
              <li><a href="/pdf-tools/split" className="hover:text-blue-600 transition-colors">{t('tools_data.split-pdf.name', { defaultValue: 'Split PDF' })}</a></li>
              <li><a href="/pdf-tools/merge" className="hover:text-blue-600 transition-colors">{t('tools_data.merge-pdf.name', { defaultValue: 'Merge PDF' })}</a></li>
              <li><a href="/pdf-tools/compress" className="hover:text-blue-600 transition-colors">{t('tools_data.compress-pdf.name', { defaultValue: 'Compress PDF' })}</a></li>
              <li><a href="/pdf-tools/to-image" className="hover:text-blue-600 transition-colors">{t('tools_data.pdf-to-image.name', { defaultValue: 'PDF to Image' })}</a></li>
              <li><a href="/pdf-tools/image-to-pdf" className="hover:text-blue-600 transition-colors">{t('tools_data.image-to-pdf.name', { defaultValue: 'Image to PDF' })}</a></li>
            </ul>
          </div>

          {/* Other Tools */}
           <div>
            <h3 className="font-bold text-gray-900 mb-4">{t('footer.more', { defaultValue: 'Other Tools' })}</h3>
            <ul className="space-y-3 text-gray-500">
              <li><a href="/pdf-tools/lock-unlock" className="hover:text-blue-600 transition-colors">{t('tools_data.lock-unlock-pdf.name', { defaultValue: 'Lock / Unlock PDF' })}</a></li>
              <li><a href="/image-tools/compress" className="hover:text-blue-600 transition-colors">{t('tools_data.compress-image.name', { defaultValue: 'Compress Image' })}</a></li>
              <li><a href="/image-tools/resize" className="hover:text-blue-600 transition-colors">{t('tools_data.resize-image.name', { defaultValue: 'Resize Image' })}</a></li>
              <li><a href="/image-tools/to-base64" className="hover:text-blue-600 transition-colors">{t('tools_data.image-to-base64.name', { defaultValue: 'Image to Base64' })}</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400">&copy; {currentYear} {t('hero.title')}. {t('footer.rights')}</p>
          <div className="flex items-center gap-6">
             <a href="https://www.linkedin.com/in/sarthakworks/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
               <span className="sr-only">LinkedIn</span>
               <Linkedin className="w-5 h-5" />
             </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
