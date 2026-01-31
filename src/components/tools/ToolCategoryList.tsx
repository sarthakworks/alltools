import React from 'react';
import { allTools } from '../../data/tools';
import { useTranslation } from 'react-i18next';
import '../../i18n';

interface ToolCategoryListProps {
  category: string;
}

export default function ToolCategoryList({ category }: ToolCategoryListProps) {
  const { t } = useTranslation();
  
  const tools = allTools.filter(t => t.category === category);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tools.map(tool => {
        const Icon = tool.icon;
        return (
          <a 
            key={tool.id}
            href={tool.href} 
            className="block p-8 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div className={`w-12 h-12 ${tool.color || 'bg-gray-100 text-gray-600'} rounded-lg flex items-center justify-center mb-6`}>
                <Icon size={24} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              {t(`tools_data.${tool.id}.name`, { defaultValue: tool.name })}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {t(`tools_data.${tool.id}.desc`, { defaultValue: tool.desc })}
            </p>
          </a>
        );
      })}
    </div>
  );
}
