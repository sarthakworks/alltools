import React from 'react';
import { useTranslation } from 'react-i18next';
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
              <li><a href="/ai-tools" className="hover:text-blue-600 transition-colors">Essay Writer</a></li>
              <li><a href="/image-tools" className="hover:text-blue-600 transition-colors">Background Remover</a></li>
              <li><a href="/ai-tools" className="hover:text-blue-600 transition-colors">Paragraph Writer</a></li>
              <li><a href="/image-tools" className="hover:text-blue-600 transition-colors">AI Image Generator</a></li>
            </ul>
          </div>

          {/* PDF Tools */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">{t('footer.pdf_tools')}</h3>
            <ul className="space-y-3 text-gray-500">
              <li><a href="/pdf-tools/merge" className="hover:text-blue-600 transition-colors">Split PDF</a></li>
              <li><a href="/pdf-tools/merge" className="hover:text-blue-600 transition-colors">Merge PDF</a></li>
              <li><a href="/pdf-tools/compress" className="hover:text-blue-600 transition-colors">Compress PDF</a></li>
              <li><a href="/pdf-tools/to-image" className="hover:text-blue-600 transition-colors">PDF to JPG</a></li>
              <li><a href="/pdf-tools/image-to-pdf" className="hover:text-blue-600 transition-colors">JPG to PDF</a></li>
            </ul>
          </div>

          {/* Comparison */}
           <div>
            <h3 className="font-bold text-gray-900 mb-4">{t('footer.more')}</h3>
            <ul className="space-y-3 text-gray-500">
              <li><a href="#" className="hover:text-blue-600 transition-colors">Edit PDF</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Sign PDF</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Watermark PDF</a></li>
              <li><a href="#" className="hover:text-blue-600 transition-colors">Rotate PDF</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400">&copy; {currentYear} {t('hero.title')}. {t('footer.rights')}</p>
          <div className="flex items-center gap-6">
             {/* Social Icons placeholder */}
             <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><span className="sr-only">Twitter</span><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 9.5a9.5 9.5 0 0 1-9.5 9.5A9.5 9.5 0 0 1 4 19c0 5.25 4.25 9.5 9.5 9.5S23 24.25 23 19v-9.5z" opacity="0"/><path fillRule="evenodd" d="M22 5.8a8.49 8.49 0 0 1-2.36.64 4.13 4.13 0 0 0 1.81-2.27 8.21 8.21 0 0 1-2.61 1 4.1 4.1 0 0 0-7 3.74 11.64 11.64 0 0 1-8.45-4.29 4.16 4.16 0 0 0-.55 2.07 4.09 4.09 0 0 0 1.82 3.41 4.09 4.09 0 0 1-1.86-.51v.05a4.1 4.1 0 0 0 3.3 4 4.09 4.09 0 0 1-1.85.07 4.1 4.1 0 0 0 3.83 2.85A8.23 8.23 0 0 1 2 18.4a11.62 11.62 0 0 0 6.29 1.85C15.91 20.25 20 13.91 20 8.46v-.37A8.42 8.42 0 0 0 22 5.8z" clipRule="evenodd"/></svg></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
