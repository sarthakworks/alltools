import React, { useState, useEffect } from 'react';
import { Copy, FileCode, ArrowRight, AlertCircle, Loader2, Check } from 'lucide-react';
import * as sass from 'sass';
import { useTranslation } from 'react-i18next';
import '../../../i18n';
import { useCopyToClipboard } from '../../common/hooks/useCopyToClipboard';

export default function SassToCss() {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [options, setOptions] = useState<{ style: 'expanded' | 'compressed' }>({ style: 'expanded' });
  const { copiedId, handleCopy } = useCopyToClipboard();

  // Dynamically load Sass if needed, but since we imported it, we'll try to use it directly.
  // Note: Standard 'sass' package might be heavy or Node-dependent. 
  // If this fails in browser, we might need a specific browser build or rely on an API.
  // For this implementation, we will try to use the compileString method.

  const compileSass = async () => {
    setError("");
    setLoading(true);
    if (!input.trim()) {
      setError(t('tools_ui.sass_to_css.error_empty'));
      setLoading(false);
      return;
    }

    try {
      // sass.compileString is synchronous in the JS API usually, but let's wrap it 
      // or use compileStringAsync if available to avoid blocking UI.
      const result = await sass.compileStringAsync(input, {
        style: options.style,
        syntax: 'scss', // Default to SCSS
      });
      setOutput(result.css);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  const loadSample = () => {
    const sample = `$primary-color: #3b82f6;

.button {
  background-color: $primary-color;
  &:hover {
    background-color: darken($primary-color, 10%);
  }
}`;
    setInput(sample);
    setOutput("");
    setError("");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4 flex items-center justify-center gap-3">
          <FileCode className="w-10 h-10 text-pink-600" />
          {t('tools_ui.sass_to_css.title')}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('tools_ui.sass_to_css.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">{t('tools_ui.sass_to_css.input_label')}</h2>
            <button 
              onClick={loadSample}
              className="text-xs font-medium text-pink-600 hover:text-pink-700 bg-pink-50 px-3 py-1.5 rounded-full transition-colors"
            >
              {t('tools_ui.common.load_sample')}
            </button>
          </div>
          
          <div className="p-4 grow flex flex-col">
            <textarea
              className="w-full grow p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none resize-none font-mono text-sm bg-gray-50 min-h-100"
              placeholder="Paste your SCSS here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
           <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <select 
                    value={options.style} 
                    onChange={(e) => setOptions({ style: e.target.value as any })}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-pink-500"
                >
                    <option value="expanded">Expanded</option>
                    <option value="compressed">Compressed</option>
                </select>
                
                <button
                    onClick={compileSass}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors shadow-sm shadow-pink-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {t('tools_ui.sass_to_css.compile')}
                </button>
            </div>

            {output && (
                 <button 
                    onClick={() => handleCopy(output, 'sass-output')}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-pink-600 transition-colors"
                  >
                    {copiedId === 'sass-output' ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> {t('tools_ui.common.copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> {t('tools_ui.common.copy')}
                      </>
                    )}
                  </button>
            )}
          </div>

          <div className="p-4 grow flex flex-col relative">
             {error ? (
                <div className="w-full h-full min-h-100 flex items-center justify-center bg-red-50 rounded-xl border border-red-100 p-6 text-center">
                    <div className="max-w-md">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                        <h3 className="font-semibold text-red-900 mb-1">{t('tools_ui.sass_to_css.error')}</h3>
                        <p className="text-red-600 text-sm font-mono break-all bg-white p-3 rounded-lg border border-red-100 mx-auto inline-block">
                            {error}
                        </p>
                    </div>
                </div>
             ) : (
                <textarea
                    readOnly
                    className="w-full grow p-4 rounded-xl border border-gray-200 text-gray-800 font-mono text-sm bg-white min-h-100 outline-none resize-none"
                    placeholder={t('tools_ui.sass_to_css.output_label')}
                    value={output}
                />
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
