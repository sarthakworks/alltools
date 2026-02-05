import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ArrowRight, FileText, Image as ImageIcon, Zap, CheckCircle, Shield, PenTool, MegaphoneOff, Infinity} from 'lucide-react';
import ToolsGrid from './ToolsGrid';
import { categories, stats, allTools, popularTools } from './common/data/tools';
import { useToolSearch } from './common/searchAlgo';
import '../i18n';

export default function HomeContent() {
  const { t } = useTranslation();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const typewriterWords = t('hero.typewriter_words', { returnObjects: true, defaultValue: ['Education', 'Business', 'Life', 'Work', 'Creativity'] }) as string[];
  const words = Array.isArray(typewriterWords) ? typewriterWords : ['Education'];

  // Use shared search hook
  const {
    searchQuery,
    showDropdown,
    setShowDropdown,
    filteredTools,
    searchRef,
    handleSearchChange,
    handleToolClick
  } = useToolSearch(allTools);

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
          <div ref={searchRef} className="max-w-2xl mx-auto relative mb-16 px-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                 <Search className="h-6 w-6 text-blue-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                placeholder={t('search.placeholder', { defaultValue: 'Search tools...' })}
                className="w-full pl-16 pr-32 py-5 rounded-full border border-gray-200 shadow-lg shadow-blue-500/5 text-lg focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
              />
              <button 
                onClick={() => filteredTools.length > 0 && handleToolClick(filteredTools[0].href)}
                className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-8 rounded-full font-semibold hover:bg-blue-700 transition-colors shadow-md"
              >
                {t('hero.search_button', { defaultValue: 'Search' })}
              </button>

              {/* Search Dropdown */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-96 overflow-y-auto z-50">
                  {filteredTools.length > 0 ? (
                    <div className="p-2">
                      {filteredTools.slice(0, 8).map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => handleToolClick(tool.href)}
                          className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                        >
                          <div className={`w-12 h-12 rounded-lg ${tool.color || 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                            <tool.icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {tool.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">{tool.desc}</div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-gray-500 font-medium mb-4">
                        Sorry, couldn't find what you're looking for
                      </p>
                      <p className="text-sm text-gray-400 mb-4">Try these popular tools:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {popularTools.slice(0, 5).map((tool) => (
                          <button
                            key={tool.id}
                            onClick={() => handleToolClick(tool.href)}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                          >
                            <div className={`w-10 h-10 rounded-lg ${tool.color || 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                              <tool.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                                {tool.name}
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                    <span 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = cat.featured.href;
                      }}
                      className={`cursor-pointer text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all truncate text-center min-w-22.5 bg-gray-50 text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-md z-20 relative`}
                    >
                      {t(`tools_data.${cat.featured.name.toLowerCase().replace(/ /g, '-').replace('(', '').replace(')', '').replace(/'/g, '')}.name`, { defaultValue: cat.featured.name })}
                    </span>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>
      
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
            <div className="flex gap-2 hidden">
              <button className="p-2 rounded-full border border-gray-100 hover:bg-gray-50" aria-label="Previous"><ArrowRight className="w-5 h-5 rotate-180 text-gray-400" /></button>
              <button className="p-2 rounded-full bg-blue-600 text-white" aria-label="Next"><ArrowRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Image to PDF */}
            <a href="/pdf-tools/image-to-pdf" className="bg-blue-50 rounded-3xl p-8 h-80 relative overflow-hidden group hover:shadow-lg transition-all block">
              <div className="relative z-10">
                 <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-blue-600">
                    <ImageIcon className="w-6 h-6" />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('tools_data.image-to-pdf.name', { defaultValue: 'Image to PDF' })}</h3>
                 <p className="text-gray-600 text-sm mb-6">{t('tools_data.image-to-pdf.desc', { defaultValue: 'Convert JPG/PNG to PDF' })}</p>
                 <span className="text-blue-600 font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                   {t('home.start_creating', { defaultValue: 'Start Creating' })} <ArrowRight className="w-4 h-4" />
                 </span>
              </div>
              <div className="absolute top-1/2 -right-12.5 w-64 h-64 bg-white/40 rounded-full blur-3xl group-hover:bg-white/60 transition-colors"></div>
            </a>

            {/* Background Remover */}
            <a href="/image-tools/remove-bg" className="bg-purple-50 rounded-3xl p-8 h-80 relative overflow-hidden group hover:shadow-lg transition-all block">
              <div className="relative z-10">
                 <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-purple-600">
                    <Infinity className="w-6 h-6" />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('tools_data.remove-bg.name', { defaultValue: 'Remove Background' })}</h3>
                 <p className="text-gray-600 text-sm mb-6">{t('tools_data.remove-bg.desc', { defaultValue: 'AI-powered background removal' })}</p>
                 <span className="text-purple-600 font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                   {t('home.remove_bg', { defaultValue: 'Remove BG' })} <ArrowRight className="w-4 h-4" />
                 </span>
              </div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-200/30 rounded-full blur-2xl"></div>
            </a>

            {/* Compress Image (Replaces Photo Cleanup) */}
            <a href="/image-tools/compress" className="bg-green-50 rounded-3xl p-8 h-80 relative overflow-hidden group hover:shadow-lg transition-all block">
              <div className="relative z-10">
                 <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-green-600">
                    <Zap className="w-6 h-6" />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('tools_data.compress-image.name', { defaultValue: 'Compress Image' })}</h3>
                 <p className="text-gray-600 text-sm mb-6">{t('tools_data.compress-image.desc', { defaultValue: 'Reduce image file size' })}</p>
                 <span className="text-green-600 font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                   {t('home.clean_photo', { defaultValue: 'Clean Photo' })} <ArrowRight className="w-4 h-4" />
                 </span>
              </div>
              <div className="absolute top-0 -right-5 w-32 h-32 bg-green-200/40 rounded-full blur-xl"></div>
            </a>
          </div>
        </div>
      </section>

      {/* Free & Ethical Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-24 overflow-hidden relative">
        <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 max-w-6xl mx-auto">
          <div className="max-w-xl">
            <h2 className="text-4xl font-bold mb-4">{t('premium.title', { defaultValue: 'Fully Free & Ethical Tools' })}</h2>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              {t('premium.subtitle', { defaultValue: 'Our app is completely free with no hidden costs. We don\'t track your data, use no dark patterns, and are fully open-source. Enjoy unlimited usage with faster processing, all while respecting your privacy. Built for fun—we take no legal responsibility for usage.' })}
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
               <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                 <Shield className="w-4 h-4" /> {t('premium.no_tracking', { defaultValue: 'No tracking' })}
               </div>
               <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                 <PenTool className="w-4 h-4" /> {t('premium.open_source', { defaultValue: 'Open source' })}
               </div>
               <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                 <CheckCircle className="w-4 h-4" /> {t('premium.no_dark_patterns', { defaultValue: 'No dark patterns' })}
               </div>
               <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                 <MegaphoneOff className="w-4 h-4" /> {t('premium.ad_free', { defaultValue: 'Ad-free' })}
               </div>
               <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                 <Infinity className="w-4 h-4" /> {t('premium.unlimited', { defaultValue: 'Unlimited usage' })}
               </div>
            </div>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-blue-50 transition-colors"
            >
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
