import React, { useState } from 'react';
import { Copy, FileCode, AlignLeft, AlertCircle } from 'lucide-react';
import * as prettier from "prettier/standalone";
import * as parserHtml from "prettier/plugins/html";

export default function HtmlFormatter() {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [indentSize, setIndentSize] = useState<number>(2);

  const formatHtml = async () => {
    setError("");
    if (!input.trim()) {
      setError("Please enter some HTML to format.");
      return;
    }

    try {
      const formatted = await prettier.format(input, {
        parser: "html",
        plugins: [parserHtml],
        tabWidth: indentSize,
        printWidth: 80,
      });
      setOutput(formatted);
    } catch (err: any) {
      setError(`Formatting Error: ${err.message}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  };

  const loadSample = () => {
    const sample = `<!DOCTYPE html><html><head><title>Page Title</title></head><body><h1>My First Heading</h1><p>My first paragraph.</p></body></html>`;
    setInput(sample);
    setOutput("");
    setError("");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4 flex items-center justify-center gap-3">
          <FileCode className="w-10 h-10 text-orange-600" />
          HTML Formatter
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Beautify not only your HTML code, but your day.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Input HTML</h2>
            <button 
              onClick={loadSample}
              className="text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-full transition-colors"
            >
              Load Sample
            </button>
          </div>
          
          <div className="p-4 grow flex flex-col">
            <textarea
              className="w-full grow p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none resize-none font-mono text-sm bg-gray-50 min-h-100"
              placeholder="Paste your HTML here..."
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
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:border-orange-500"
                >
                    <option value={2}>2 Spaces</option>
                    <option value={4}>4 Spaces</option>
                </select>
                
                <button
                    onClick={formatHtml}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors shadow-sm shadow-orange-600/20"
                >
                    <AlignLeft className="w-4 h-4" /> Format
                </button>
            </div>

            {output && (
                 <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-orange-600 transition-colors"
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
                        <h3 className="font-semibold text-red-900 mb-1">Formatting Error</h3>
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
