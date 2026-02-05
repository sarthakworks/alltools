import React, { useState } from 'react';
import { Copy, FileJson, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { xml2json, json2xml } from 'xml-js';
import { useTranslation } from 'react-i18next';
import '../../../i18n';

export default function XmlToJson() {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [mode, setMode] = useState<'xml2json' | 'json2xml'>('xml2json');
  const [error, setError] = useState<string>("");

  const convert = () => {
    setError("");
    if (!input.trim()) {
      setError(`${t('tools_ui.common.please_enter')} ${mode === 'xml2json' ? 'XML' : 'JSON'}`);
      return;
    }

    try {
      if (mode === 'xml2json') {
        const result = xml2json(input, { compact: true, spaces: 2 });
        setOutput(result);
      } else {
        const result = json2xml(input, { compact: true, spaces: 2, fullTagEmptyElement: true });
        setOutput(result);
      }
    } catch (err: any) {
      setError(`${t('tools_ui.xml_to_json.error')}: ${err.message}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  };

  const loadSample = () => {
    if (mode === 'xml2json') {
       setInput(`<?xml version="1.0" encoding="UTF-8"?>
<note>
  <to>Tove</to>
  <from>Jani</from>
  <heading>Reminder</heading>
  <body>Don't forget me this weekend!</body>
</note>`);
    } else {
       setInput(`{
  "note": {
    "to": { "_text": "Tove" },
    "from": { "_text": "Jani" },
    "heading": { "_text": "Reminder" },
    "body": { "_text": "Don't forget me this weekend!" }
  }
}`);
    }
    setOutput("");
    setError("");
  };

  const toggleMode = () => {
      setMode(prev => prev === 'xml2json' ? 'json2xml' : 'xml2json');
      setInput("");
      setOutput("");
      setError("");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4 flex items-center justify-center gap-3">
          <FileJson className="w-10 h-10 text-purple-600" />
          XML <ArrowRightLeft className="w-5 h-5 text-gray-400" /> JSON
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('tools_ui.xml_to_json.description')}
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg flex items-center">
            <button 
                onClick={() => setMode('xml2json')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'xml2json' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                {t('tools_ui.xml_to_json.mode_xml_json')}
            </button>
            <button 
                onClick={() => setMode('json2xml')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'json2xml' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                {t('tools_ui.xml_to_json.mode_json_xml')}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">{mode === 'xml2json' ? t('tools_ui.xml_to_json.input_xml') : t('tools_ui.xml_to_json.input_json')}</h2>
            <button 
              onClick={loadSample}
              className="text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full transition-colors"
            >
              {t('tools_ui.common.load_sample')}
            </button>
          </div>
          
          <div className="p-4 grow flex flex-col">
            <textarea
              className="w-full grow p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none resize-none font-mono text-sm bg-gray-50 min-h-100"
              placeholder={mode === 'xml2json' ? t('tools_ui.xml_to_json.placeholder_xml') : t('tools_ui.xml_to_json.placeholder_json')}
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm shadow-purple-600/20"
                >
                    <ArrowRightLeft className="w-4 h-4" /> {t('tools_ui.xml_to_json.convert')}
                </button>
            </div>

            {output && (
                 <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-purple-600 transition-colors"
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
                        <h3 className="font-semibold text-red-900 mb-1">{t('tools_ui.xml_to_json.error')}</h3>
                        <p className="text-red-600 text-sm font-mono break-all bg-white p-3 rounded-lg border border-red-100 mx-auto inline-block">
                            {error}
                        </p>
                    </div>
                </div>
             ) : (
                <textarea
                    readOnly
                    className="w-full grow p-4 rounded-xl border border-gray-200 text-gray-800 font-mono text-sm bg-white min-h-100 outline-none resize-none"
                    placeholder={t('tools_ui.xml_to_json.placeholder_output')}
                    value={output}
                />
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
