import React, { useState } from 'react';
import { Copy, FileJson, ArrowRight, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../../../i18n';

export default function JsonToJs() {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");

  const convert = () => {
    setError("");
    if (!input.trim()) {
      setError(t('tools_ui.json_to_js.error_empty'));
      return;
    }

    try {
      // First validate if it is valid JSON
      const parsed = JSON.parse(input);
      
      // Convert to JS Object string (unquote keys where possible)
      // We can use a regex replacement on generic JSON stringify
      let jsString = JSON.stringify(parsed, null, 2);
      
      // Regex to remove quotes from keys
      // Matches "key": value  -> key: value
      // But we must be careful not to unquote keys with special chars
      jsString = jsString.replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, "$1:");
      
      // Replace double quotes with single quotes for values if preferred (optional, sticking to double for standard JS)
      // But let's keep it simple: unquoted keys is the main feature.
      
      setOutput(jsString);
    } catch (err: any) {
      setError(`${t('tools_ui.common.invalid_json')} ${err.message}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  };

  const loadSample = () => {
    const sample = `{
  "id": 123,
  "user_name": "Antigravity",
  "isActive": true,
  "roles": ["admin", "editor"],
  "meta-data": { "location": "US" }
}`;
    setInput(sample);
    setOutput("");
    setError("");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4 flex items-center justify-center gap-3">
          <FileJson className="w-10 h-10 text-emerald-600" />
          {t('tools_ui.json_to_js.title')}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('tools_ui.json_to_js.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">{t('tools_ui.json_to_js.input_label')}</h2>
            <button 
              onClick={loadSample}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full transition-colors"
            >
              {t('tools_ui.common.load_sample')}
            </button>
          </div>
          
          <div className="p-4 grow flex flex-col">
            <textarea
              className="w-full grow p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none font-mono text-sm bg-gray-50 min-h-100"
              placeholder={t('tools_ui.json_to_js.placeholder_input')}
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
                <button
                    onClick={convert}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20"
                >
                    <ArrowRight className="w-4 h-4" /> {t('tools_ui.json_to_js.convert')}
                </button>
            </div>

            {output && (
                 <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-emerald-600 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Result
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
                    placeholder={t('tools_ui.json_to_js.result_label')}
                    value={output}
                />
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
