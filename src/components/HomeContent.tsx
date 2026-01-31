import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ArrowRight, FileText, Image as ImageIcon, Zap, CheckCircle, Shield, PenTool } from 'lucide-react';
import ToolsGrid from './ToolsGrid';
import { categories, stats } from '../data/tools';
import '../i18n';

export default function HomeContent() {
  const { t } = useTranslation();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const typewriterWords = t('hero.typewriter_words', { returnObjects: true, defaultValue: ['Education', 'Business', 'Life', 'Work', 'Creativity'] }) as string[];
  const words = Array.isArray(typewriterWords) ? typewriterWords : ['Education'];

  // Typewriter effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="bg-white pt-20 pb-24 text-center px-4 relative overflow-hidden">
        {/* Floating Background Shapes */}
        <div className="absolute top-20 left-10 w-12 h-12 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-8 h-8 bg-blue-500 rotate-45 opacity-20"></div>
        <div className="absolute bottom-10 left-1/4 w-4 h-4 bg-red-400 rounded-full opacity-30"></div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-[#111827] mb-6 tracking-tight leading-tight">
            {t('hero.title_start', { defaultValue: 'Free Tools to Make' })} <br className="md:hidden" />
            <span 
              key={currentWordIndex}
              className="text-blue-600 bg-blue-50 px-2 rounded-lg inline-block transition-all duration-500 ease-in-out animate-fade-in-up"
            >
              {words[currentWordIndex]}
            </span> {t('hero.title_end', { defaultValue: 'Simple' })}
          </h1>
          <p className="text-gray-500 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            {t('hero.subtitle', { defaultValue: 'We offer PDF, miscellaneous, image and other online tools to make your life easier' })}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative mb-16 px-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                 <Search className="h-6 w-6 text-blue-500" />
              </div>
              <input
                type="text"
                placeholder={t('search.placeholder', { defaultValue: 'Search' })}
                className="w-full pl-16 pr-32 py-5 rounded-full border border-gray-200 shadow-lg shadow-blue-500/5 text-lg focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
              />
              <button className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-8 rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-md">
                {t('hero.search_button', { defaultValue: 'Search' })}
              </button>
            </div>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto px-4 mt-16 text-left">
            {categories.map((cat) => (
              <a key={cat.id} href={cat.href} className="group flex flex-col rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`${cat.color} p-6 h-42 relative flex flex-col justify-between`}>
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white">
                      <cat.icon className="w-5 h-5" />
                    </div>
                    {cat.count && (
                      <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold text-white tracking-wide">{cat.count}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-0.5">{t(`nav.${cat.id}`, { defaultValue: cat.name })}</h3>
                    <div className="flex justify-between items-end">
                      <p className="text-white/80 text-xs leading-none">{t(`categories.${cat.id}.desc`, { defaultValue: cat.desc })}</p>
                      <ArrowRight className="text-white w-4 h-4 opacity-75 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
                {cat.featured && (
                  <div className={`${cat.lightColor || 'bg-gray-50'} p-4 flex justify-between items-center h-16`}>
                    <div className="flex flex-col">
                       <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider leading-tight">{t('tools.featured_label', { defaultValue: 'Featured' })}</span>
                       <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider leading-tight">{t('tools.tool_label', { defaultValue: 'Tool' })} :</span>
                    </div>
                    <span className={`text-[10px] font-bold bg-white px-3 py-2 rounded-xl shadow-sm hover:shadow-md transition-all truncate text-center min-w-[90px] ${cat.color.replace('bg-', 'text-').replace('[#', 'text-[#')}`}>
                      {t(`tools_data.${cat.featured.name.toLowerCase().replace(/ /g, '-').replace('(', '').replace(')', '').replace(/'/g, '')}.name`, { defaultValue: cat.featured.name })}
                    </span>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="bg-[#f3f7fa] border-y border-gray-100 py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-200/50">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center px-4">
                  <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1">{stat.value}</div>
                  <div className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-widest">{t(`stats.${stat.label.toLowerCase().replace(/ /g, '_')}`, { defaultValue: stat.label })}</div>
                </div>
              ))}
            </div>
          </div>
      </div>

      {/* Popular Tools Section */}
      <section className="bg-gray-50 py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('tools.most_popular_title', { defaultValue: 'Our Most Popular Tools' })}</h2>
              <p className="text-gray-500">{t('tools.most_popular_subtitle', { defaultValue: 'We present the best of the best. All free, no catch.' })}</p>
            </div>
            <ToolsGrid />
          </div>
      </section>

      {/* Free Tools Section */}
      <section className="bg-white py-24 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between md:items-end mb-12 max-w-6xl mx-auto gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t('home.free_tools_title', { defaultValue: 'Free Tools You’d Usually Pay For' })}</h2>
              <p className="text-gray-500">{t('home.free_tools_subtitle', { defaultValue: 'No limits, No Sign-ups' })}</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-full border border-gray-100 hover:bg-gray-50" aria-label="Previous"><ArrowRight className="w-5 h-5 rotate-180 text-gray-400" /></button>
              <button className="p-2 rounded-full bg-blue-600 text-white" aria-label="Next"><ArrowRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* PDF Creator */}
            <div className="bg-blue-50 rounded-3xl p-8 h-80 relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer">
              <div className="relative z-10">
                 <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-blue-600">
                    <FileText className="w-6 h-6" />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('home.pdf_creator_title', { defaultValue: 'PDF Creator' })}</h3>
                 <p className="text-gray-600 text-sm mb-6">{t('home.pdf_creator_desc', { defaultValue: 'Create PDFs quickly and easily with our free PDF creator.' })}</p>
                 <span className="text-blue-600 font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                   {t('home.start_creating', { defaultValue: 'Start Creating' })} <ArrowRight className="w-4 h-4" />
                 </span>
              </div>
              <div className="absolute top-1/2 right-[-50px] w-64 h-64 bg-white/40 rounded-full blur-3xl group-hover:bg-white/60 transition-colors"></div>
            </div>

            {/* Background Remover */}
            <div className="bg-purple-50 rounded-3xl p-8 h-80 relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer">
              <div className="relative z-10">
                 <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-purple-600">
                    <ImageIcon className="w-6 h-6" />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('home.bg_remover_title', { defaultValue: 'Background Remover' })}</h3>
                 <p className="text-gray-600 text-sm mb-6">{t('home.bg_remover_desc', { defaultValue: 'Remove or change the background of a photo automatically.' })}</p>
                 <span className="text-purple-600 font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                   {t('home.remove_bg', { defaultValue: 'Remove BG' })} <ArrowRight className="w-4 h-4" />
                 </span>
              </div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-200/30 rounded-full blur-2xl"></div>
            </div>

            {/* Photo Cleanup */}
            <div className="bg-green-50 rounded-3xl p-8 h-80 relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer">
              <div className="relative z-10">
                 <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-green-600">
                    <Zap className="w-6 h-6" />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('home.photo_cleanup_title', { defaultValue: 'Photo Cleanup' })}</h3>
                 <p className="text-gray-600 text-sm mb-6">{t('home.photo_cleanup_desc', { defaultValue: 'Use AI to remove unwanted objects, texts, people from an image.' })}</p>
                 <span className="text-green-600 font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                   {t('home.clean_photo', { defaultValue: 'Clean Photo' })} <ArrowRight className="w-4 h-4" />
                 </span>
              </div>
              <div className="absolute top-0 right-[-20px] w-32 h-32 bg-green-200/40 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-24 overflow-hidden relative">
        <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 max-w-6xl mx-auto">
          <div className="max-w-xl">
            <h2 className="text-4xl font-bold mb-4">{t('premium.title', { defaultValue: 'Get more with Premium' })}</h2>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              {t('premium.subtitle', { defaultValue: 'Keep your projects further with premium tools that stay out of your way and work smarter. Create without limits, ads, or roadblocks. Get started for just $3.99 a month.' })}
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
               <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium">
                 <Shield className="w-4 h-4" /> {t('premium.ad_free', { defaultValue: 'Ad-free' })}
               </div>
               <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium">
                 <CheckCircle className="w-4 h-4" /> {t('premium.unlimited', { defaultValue: 'Unlimited usage' })}
               </div>
               <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium">
                 <Zap className="w-4 h-4" /> {t('premium.faster', { defaultValue: 'Faster processing' })}
               </div>
            </div>
            <button className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-blue-50 transition-colors">
              {t('premium.cta', { defaultValue: 'Get Started' })}
            </button>
          </div>
          
          {/* Visual Illustration */}
          <div className="hidden md:block w-[500px] h-[300px] bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm p-6 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
               <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                 <PenTool className="w-10 h-10 text-white" />
               </div>
               <div className="w-32 h-4 bg-white/20 rounded-full mx-auto mb-2"></div>
               <div className="w-24 h-4 bg-white/10 rounded-full mx-auto"></div>
             </div>
             {/* Floating elements */}
             <div className="absolute top-10 left-10 w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center text-red-500 transform rotate-12"><FileText size={20} /></div>
             <div className="absolute bottom-10 right-10 w-12 h-12 bg-white rounded-lg shadow-lg flex items-center justify-center text-green-500 transform -rotate-12"><ImageIcon size={20} /></div>
             <div className="absolute top-1/4 right-8 w-10 h-10 bg-white/20 rounded-full"></div>
          </div>
        </div>
      </section>
    </main>
  );
}
