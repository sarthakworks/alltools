import React, { useState } from 'react';
import { Copy, FileJson, Minimize2, AlignLeft, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../../../i18n';

export default function JsonFormatter() {
  const { t } = useTranslation();
  const [jsonInput, setJsonInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [indentation, setIndentation] = useState<number | string>(2);

  const formatJson = () => {
    setError("");
    if (!jsonInput.trim()) {
      setError(t('tools_ui.json_formatter.error_empty'));
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const indent = indentation === 'tab' ? '\t' : Number(indentation);
      setOutput(JSON.stringify(parsed, null, indent));
    } catch (err: any) {
      setError(`${t('tools_ui.json_formatter.error_invalid')}${err.message}`);
    }
  };

  const minifyJson = () => {
    setError("");
    if (!jsonInput.trim()) {
        setError(t('tools_ui.json_formatter.error_empty_minify'));
        return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      setOutput(JSON.stringify(parsed));
    } catch (err: any) {
      setError(`${t('tools_ui.json_formatter.error_invalid')}${err.message}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  };

  const loadSample = () => {
    const sample = {
      project: "AllTools",
      version: 1.0,
      active: true,
      features: ["PDF Tools", "Image Tools", "Coding Tools"],
      author: {
        name: "Antigravity",
        role: "AI Assistant"
      }
    };
    setJsonInput(JSON.stringify(sample, null, 2));
    setOutput(""); // Clear output so user has to click format
    setError("");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4 flex items-center justify-center gap-3">
          <FileJson className="w-10 h-10 text-teal-600" />
          {t('tools_ui.json_formatter.title')}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('tools_ui.json_formatter.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">{t('tools_ui.json_formatter.input_label')}</h2>
            <button 
              onClick={loadSample}
              className="text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full transition-colors"
            >
              {t('tools_ui.json_formatter.load_sample')}
            </button>
          </div>
          
          <div className="p-4 grow flex flex-col">
            <textarea
              className="w-full grow p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none resize-none font-mono text-sm bg-gray-50 min-h-100"
              placeholder={t('tools_ui.json_formatter.placeholder_input')}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
           <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <select 
                    value={indentation} 
                    onChange={(e) => setIndentation(e.target.value === 'tab' ? 'tab' : Number(e.target.value))}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-teal-500"
                >
                    <option value={2}>{t('tools_ui.json_formatter.indent_2')}</option>
                    <option value={4}>{t('tools_ui.json_formatter.indent_4')}</option>
                    <option value="tab">{t('tools_ui.json_formatter.indent_tabs')}</option>
                </select>
                
                <button
                    onClick={formatJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-sm shadow-teal-600/20"
                >
                    <AlignLeft className="w-4 h-4" /> {t('tools_ui.json_formatter.format')}
                </button>
                <button
                    onClick={minifyJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Minimize2 className="w-4 h-4" /> {t('tools_ui.json_formatter.minify')}
                </button>
            </div>

            {output && (
                 <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-teal-600 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> {t('tools_ui.common.copy')}
                  </button>
            )}
          </div>

          <div className="p-4 grow flex flex-col relative">
             {error ? (
                <div className="w-full h-full min-h-100 flex items-center justify-center bg-red-50 rounded-xl border border-red-100 p-6 text-center">
                    <div className="max-w-md">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                        <h3 className="font-semibold text-red-900 mb-1">{t('tools_ui.common.error')}</h3>
                        <p className="text-red-600 text-sm font-mono break-all bg-white p-3 rounded-lg border border-red-100 mx-auto inline-block">
                            {error}
                        </p>
                    </div>
                </div>
             ) : (
                <textarea
                    readOnly
                    className="w-full grow p-4 rounded-xl border border-gray-200 text-gray-800 font-mono text-sm bg-white min-h-100 outline-none resize-none"
                    placeholder={t('tools_ui.json_formatter.result_placeholder')}
                    value={output}
                />
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
