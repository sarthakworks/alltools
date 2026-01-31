import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronDown, 
  Share2, 
  Menu, 
  X,
  Languages,
  ChevronRight
} from 'lucide-react';
import { categories, allTools } from '../data/tools';
import LanguageSwitcher from './LanguageSwitcher';
import { useToolSearch } from './common/searchAlgo';
import '../i18n';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangSwitcherOpen, setIsLangSwitcherOpen] = useState(false);
  const { t } = useTranslation();

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

  // Group tools by category for the dropdowns
  const navItems = categories.map(cat => {
    const catTools = allTools.filter(t => t.category === cat.id);
    return {
      label: cat.name.replace(' Tools', ''), // Fallback label
      id: cat.id,
      href: cat.href,
      featured: catTools.slice(0, 4).map(t => ({
        id: t.id,
        name: t.name,
        icon: t.icon,
        desc: t.desc,
        href: t.href,
        color: t.color || 'bg-gray-100 text-gray-600'
      })),
      others: catTools.slice(4).map(t => ({
        id: t.id,
        name: t.name,
        href: t.href
      }))
    };
  });

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm" onMouseLeave={() => setActiveDropdown(null)}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Left Section: Logo & Nav */}
        <div className="flex items-center gap-12">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-command"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold text-gray-900 tracking-tight">{t('hero.title')}</span>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest pl-0.5">by Sarthak</span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => (
              <div 
                key={item.id} 
                className="relative group"
                onMouseEnter={() => setActiveDropdown(item.id)}
              >
                <button 
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeDropdown === item.id ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {t(`nav.${item.id}`, { defaultValue: item.label })} 
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === item.id ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {activeDropdown === item.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1 w-120 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                      <div className="flex">
                        {/* Featured Tools Column */}
                        <div className="w-1/2 p-4 border-r border-gray-50 bg-white">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('tools.featured')}</h3>
                          <div className="space-y-1">
                            {item.featured.map((tool) => {
                               // Assuming tool names are dynamic, we might keep them as is or try to translate if keys exist
                               // For this scope, we keep tool names as is or basic translation if added
                              const Icon = tool.icon;
                              return (
                                <a 
                                  key={tool.name}
                                  href={tool.href}
                                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tool.color}`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{t(`tools_data.${tool.id}.name`, { defaultValue: tool.name })}</div>
                                    <div className="text-xs text-gray-500">{t(`tools_data.${tool.id}.desc`, { defaultValue: tool.desc })}</div>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </div>

                        {/* Other Tools Column */}
                        <div className="w-1/2 p-4 bg-gray-50/50">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('tools.other', { category: item.label })}</h3>
                          <ul className="space-y-2">
                             {item.others?.map((tool) => (
                                <li key={tool.name}>
                                  <a href={tool.href} className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                    {t(`tools_data.${tool.id}.name`, { defaultValue: tool.name })}
                                  </a>
                                </li>
                             ))}
                             <li>
                               <a href={`/${item.id}-tools`} className="text-sm font-medium text-blue-600 hover:text-blue-700 mt-2 inline-block">
                                 {t('tools.see_all', { category: item.label })} →
                               </a>
                             </li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>
        </div>

        {/* Right Section: Search & Actions */}
        <div className="flex items-center gap-3">
          
          {/* Search Bar */}
          <div ref={searchRef} className="hidden md:flex relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              aria-label="Search tools"
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.trim() && setShowDropdown(true)}
              className="block w-64 pl-9 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 sm:text-sm transition-all"
            />
            
            {/* Search Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                {filteredTools.length > 0 ? (
                  <div className="py-2">
                    {filteredTools.slice(0, 8).map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => handleToolClick(tool.href)}
                        className="w-full px-4 py-3 hover:bg-gray-50 flex items-start gap-3 text-left transition-colors"
                      >
                        <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center ${tool.color || 'bg-gray-100'}  rounded-lg`}>
                          <tool.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm">
                            {tool.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {tool.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-gray-500">No tools found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
            <button 
              aria-label="Switch Language"
              onClick={() => setIsLangSwitcherOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all"
            >
               <Languages className="w-4 h-4" />
               <span className="text-xs font-semibold capitalize tracking-wider">{t('currentLanguage', { defaultValue: 'EN' })}</span>
            </button>
            <LanguageSwitcher isOpen={isLangSwitcherOpen} onClose={() => setIsLangSwitcherOpen(false)} />

            <button 
              aria-label="Share page"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors md:block hidden"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>


          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2 text-gray-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-gray-100 bg-white overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <nav className="flex flex-col space-y-2">
                {navItems.map(item => (
                  <a 
                    key={item.id} 
                    href={`/${item.id}-tools`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    {t(`nav.${item.id}`, { defaultValue: item.label })}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
              </nav>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
