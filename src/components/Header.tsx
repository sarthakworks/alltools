import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  Moon, 
  Share2, 
  Menu, 
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { allTools, categories as toolCategories } from '../data/tools';

export default function Header() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Group tools by category for the dropdowns
  const navItems = toolCategories.map(cat => {
    const catTools = allTools.filter(t => t.category === cat.id);
    return {
      label: cat.name.replace(' Tools', ''),
      id: cat.id,
      href: cat.href,
      featured: catTools.slice(0, 4).map(t => ({
        name: t.name,
        icon: t.icon,
        desc: t.desc,
        href: t.href,
        color: t.color || 'bg-gray-100 text-gray-600'
      })),
      others: catTools.slice(4).map(t => ({
        name: t.name,
        href: t.href
      }))
    };
  });

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm" onMouseLeave={() => setActiveDropdown(null)}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Left Section: Logo & Nav */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-command"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold text-gray-900 tracking-tight">AllTools</span>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest pl-0.5">by Sarthak</span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div 
                key={item.id}
                className="relative"
                onMouseEnter={() => setActiveDropdown(item.id)}
              >
                <button 
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeDropdown === item.id ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === item.id ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {activeDropdown === item.id && item.featured && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1 w-[480px] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                      <div className="flex">
                        {/* Featured Tools Column */}
                        <div className="w-1/2 p-4 border-r border-gray-50 bg-white">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Featured Tools</h3>
                          <div className="space-y-1">
                            {item.featured.map((tool) => {
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
                                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{tool.name}</div>
                                    <div className="text-xs text-gray-500">{tool.desc}</div>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </div>

                        {/* Other Tools Column */}
                        <div className="w-1/2 p-4 bg-gray-50/50">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Other {item.label} Tools</h3>
                          <ul className="space-y-2">
                             {item.others?.map((tool) => (
                                <li key={tool.name}>
                                  <a href={tool.href} className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                    {tool.name}
                                  </a>
                                </li>
                             ))}
                             <li>
                               <a href={`/${item.id}-tools`} className="text-sm font-medium text-blue-600 hover:text-blue-700 mt-2 inline-block">
                                 See All {item.label} Tools →
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
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="hidden md:flex relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              aria-label="Search tools"
              placeholder="Search tools..."
              className="block w-64 pl-9 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 sm:text-sm transition-all"
            />
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
            <button 
              aria-label="Toggle dark mode"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative"
            >
               <Moon className="w-5 h-5" />
            </button>
            <button 
              aria-label="Share page"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors md:block hidden"
            >
               <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Sign In Button */}
          <button className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-200">
            Sign In
          </button>

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
              <input
                type="text"
                aria-label="Search tools"
                placeholder="Search tools..."
                className="block w-full pl-4 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
              <nav className="flex flex-col space-y-2">
                {navItems.map(item => (
                  <a 
                    key={item.id} 
                    href={`/${item.id}-tools`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    {item.label}
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
              </nav>
              <div className="pt-4 border-t border-gray-100">
                <button className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl font-medium">
                  Sign In
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
