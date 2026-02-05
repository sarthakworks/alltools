import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { popularTools, categories, allTools } from './common/data/tools';
import { useTranslation } from 'react-i18next';
import '../i18n';

export default function ToolsGrid() {
  const [activeTab, setActiveTab] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  const tabs = [
    { id: 'all', label: t('tools.all'), icon: null },
    ...categories.map(cat => ({
      id: cat.id,
      label: t(`tools.${cat.id}`, { defaultValue: cat.name }),
      icon: cat.icon
    }))
  ];

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setIsExpanded(false);
  };

  const filteredTools = activeTab === 'all'
    ? popularTools
    : allTools.filter(tool => tool.category === activeTab);

  const displayedTools = isExpanded ? filteredTools : filteredTools.slice(0, 9);
  const showSeeAllButton = filteredTools.length > 9 && !isExpanded;

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm border border-gray-100'}`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {displayedTools.map((tool) => (
            <a
              key={tool.name}
              href={tool.href}
              className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 flex items-start gap-4"
            >
              <div className={`p-3 rounded-xl ${activeTab === 'all' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'} group-hover:scale-110 transition-transform`}>
                <tool.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                  {t(`tools_data.${tool.id}.name`, { defaultValue: tool.name })}
                  {tool.isNew && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{t('tools.new')}</span>}
                </h3>
                <p className="text-xs text-gray-500 font-medium line-clamp-2">
                  {t(`tools_data.${tool.id}.desc`, { defaultValue: tool.desc })}
                </p>
                <span className="text-blue-600 text-xs font-semibold mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  {t('tools.view_tool')} <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </a>
          ))}
        </div>

        {showSeeAllButton && (
          <div className="text-center mt-12">
            <button 
              onClick={() => setIsExpanded(true)}
              className="border border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              {t('tools.see_all', { category: activeTab === 'all' ? '' : tabs.find(t => t.id === activeTab)?.label })}
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
