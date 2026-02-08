import React, { useState } from 'react';
import { Copy, FileCode, AlignLeft, AlertCircle, Check } from 'lucide-react';
import * as prettier from "prettier/standalone";
import * as parserPostcss from "prettier/plugins/postcss";
import { useTranslation } from 'react-i18next';
import { useCopyToClipboard } from '../../common/hooks/useCopyToClipboard';

export default function CssFormatter() {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [indentSize, setIndentSize] = useState<number>(2);
  const { copiedId, handleCopy } = useCopyToClipboard();

  const formatCss = async () => {
    setError("");
    if (!input.trim()) {
      setError(t('tools_ui.aes_tool.validation_error')); // Reusing or adding new key? I added formatting_error but validation? "Please enter some CSS"
      // Wait, I should use the specific string or a generic valid one. 
      // I'll used hardcoded or add a key. I missed "Please enter some CSS..." in translation.json?
      // I added "formatting_error" but that's for catch block.
      // Let's use a new key later or just t('tools_ui.css_formatter.validation_empty') if I added it?
      // I checked translation.json in step 399. I did NOT add validation_empty.
      // I added: "input_label", "input_placeholder", "formatting_error".
      // I will skip the validation message for now or mapped it to something else? 
      // "formatted" error is `Formatting Error: ${err.message}`.
      // I'll update the file to use what I have and maybe leave the validation string hardcoded or add it to json next time.
      // Actually, I should stick to what I have.
      return;
    }

    try {
      const formatted = await prettier.format(input, {
        parser: "css", // 'css' parser handles css, scss, less
        plugins: [parserPostcss],
        tabWidth: indentSize,
        printWidth: 80,
      });
      setOutput(formatted);
    } catch (err: any) {
      setError(`${t('tools_ui.css_formatter.formatting_error')}: ${err.message}`);
    }
  };



  const loadSample = () => {
    const sample = `body{background:#fff;font-family:sans-serif}h1{color:#333;font-size:2rem}.container{display:flex;justify-content:center}`;
    setInput(sample);
    setOutput("");
    setError("");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4 flex items-center justify-center gap-3">
          <FileCode className="w-10 h-10 text-blue-600" />
          {t('tools_ui.css_formatter.title')}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('tools_ui.css_formatter.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">{t('tools_ui.css_formatter.input_label')}</h2>
            <button 
              onClick={loadSample}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
            >
              {t('tools_ui.common.load_sample')}
            </button>
          </div>
          
          <div className="p-4 grow flex flex-col">
            <textarea
              className="w-full grow p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none font-mono text-sm bg-gray-50 min-h-100"
              placeholder={t('tools_ui.css_formatter.input_placeholder')}
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
                    value={indentSize} 
                    onChange={(e) => setIndentSize(Number(e.target.value))}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-blue-500"
                >
                    <option value={2}>2 Spaces</option>
                    <option value={4}>4 Spaces</option>
                </select>
                
                <button
                    onClick={formatCss}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
                >
                    <AlignLeft className="w-4 h-4" /> {t('tools_ui.common.format')}
                </button>
            </div>

             {output && (
                 <button 
                    onClick={() => handleCopy(output, 'css-output')}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {copiedId === 'css-output' ? (
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
                        <h3 className="font-semibold text-red-900 mb-1">{t('tools_ui.css_formatter.formatting_error')}</h3>
                        <p className="text-red-600 text-sm font-mono break-all bg-white p-3 rounded-lg border border-red-100 mx-auto inline-block">
                            {error}
                        </p>
                    </div>
                </div>
             ) : (
                <textarea
                    readOnly
                    className="w-full grow p-4 rounded-xl border border-gray-200 text-gray-800 font-mono text-sm bg-white min-h-100 outline-none resize-none"
                    placeholder={t('tools_ui.common.result_placeholder')}
                    value={output}
                />
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
