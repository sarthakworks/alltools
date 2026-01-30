import React, { useState } from 'react';
import { Copy, FileJson, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { xml2json, json2xml } from 'xml-js';

export default function XmlToJson() {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [mode, setMode] = useState<'xml2json' | 'json2xml'>('xml2json');
  const [error, setError] = useState<string>("");

  const convert = () => {
    setError("");
    if (!input.trim()) {
      setError(`Please enter ${mode === 'xml2json' ? 'XML' : 'JSON'} to convert.`);
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
      setError(`Conversion Error: ${err.message}`);
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
          Convert XML to JSON and vice versa instantly.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg flex items-center">
            <button 
                onClick={() => setMode('xml2json')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'xml2json' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                XML to JSON
            </button>
            <button 
                onClick={() => setMode('json2xml')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'json2xml' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                JSON to XML
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Input {mode === 'xml2json' ? 'XML' : 'JSON'}</h2>
            <button 
              onClick={loadSample}
              className="text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full transition-colors"
            >
              Load Sample
            </button>
          </div>
          
          <div className="p-4 grow flex flex-col">
            <textarea
              className="w-full grow p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none resize-none font-mono text-sm bg-gray-50 min-h-100"
              placeholder={`Paste your ${mode === 'xml2json' ? 'XML' : 'JSON'} here...`}
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
                    <ArrowRightLeft className="w-4 h-4" /> Convert
                </button>
            </div>

            {output && (
                 <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-purple-600 transition-colors"
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
                        <h3 className="font-semibold text-red-900 mb-1">Conversion Error</h3>
                        <p className="text-red-600 text-sm font-mono break-all bg-white p-3 rounded-lg border border-red-100 mx-auto inline-block">
                            {error}
                        </p>
                    </div>
                </div>
             ) : (
                <textarea
                    readOnly
                    className="w-full grow p-4 rounded-xl border border-gray-200 text-gray-800 font-mono text-sm bg-white min-h-100 outline-none resize-none"
                    placeholder="Result will appear here..."
                    value={output}
                />
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
