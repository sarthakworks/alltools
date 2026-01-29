import React, { useState } from 'react';
import { 
  FileText, Image as ImageIcon, Video, PenTool, File, 
  ArrowRight
} from 'lucide-react';
import { popularTools } from '../data/tools';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Tools', icon: null },
  { id: 'pdf', label: 'PDF Tools', icon: FileText },
  { id: 'image', label: 'Image Tools', icon: ImageIcon },
  { id: 'video', label: 'Video Tools', icon: Video },
  { id: 'write', label: 'AI Write', icon: PenTool },
  { id: 'file', label: 'File Tools', icon: File },
];

export default function ToolsGrid() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredTools = activeTab === 'all' 
    ? popularTools 
    : popularTools.filter(t => t.category === activeTab);

  return (
    <div className="w-full">
      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {filteredTools.map((tool) => (
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
                {tool.name}
                {tool.isNew && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">NEW</span>}
              </h3>
              <p className="text-xs text-gray-500 font-medium line-clamp-2">{tool.desc}</p>
              <span className="text-blue-600 text-xs font-semibold mt-3 block opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                View Tool <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </a>
        ))}
      </div>

      <div className="text-center mt-12">
        <button className="border border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-xl transition-colors">
          See All Tools
        </button>
      </div>
    </div>
  );
}
