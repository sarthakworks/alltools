import React, { useState } from 'react';
import { Copy, FileCode, Maximize2, AlertCircle } from 'lucide-react';
import * as prettier from "prettier/standalone";
import * as parserHtml from "prettier/plugins/html";
import * as parserEstree from "prettier/plugins/estree";
import * as parserBabel from "prettier/plugins/babel";   // JS/TS
import * as parserPostcss from "prettier/plugins/postcss"; // CSS
import { xml2json, json2xml } from 'xml-js';

export default function Unminifier() {
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [lang, setLang] = useState<string>("html");

  const unminify = async () => {
    setError("");
    if (!input.trim()) {
      setError("Please enter code to unminify.");
      return;
    }

    try {
      let result = "";
      if (lang === 'html') {
          result = await prettier.format(input, { parser: "html", plugins: [parserHtml], printWidth: 80 });
      } else if (lang === 'css') {
          result = await prettier.format(input, { parser: "css", plugins: [parserPostcss], printWidth: 80 });
      } else if (lang === 'javascript') {
          result = await prettier.format(input, { parser: "babel", plugins: [parserBabel, parserEstree], printWidth: 80 });
      } else if (lang === 'json') {
          const parsed = JSON.parse(input);
          result = JSON.stringify(parsed, null, 2);
      } else if (lang === 'xml') {
          // xml-js can format (pretty print) by parsing and converting back with spaces
          // Note: This might re-order attributes or slightly change structure depending on strictness
          // Using native js2xml for formatting
          const js = xml2json(input, { compact: false }); // Parse to full JS object
          // Re-convert to XML with spaces
          // Actually, xml2json has a direct format? No, we use json2xml.
          // Let's parse efficiently:
          const jsObj = xml2json(input, { compact: true });
          result = json2xml(jsObj, { compact: true, spaces: 2, fullTagEmptyElement: true });
      }
      
      setOutput(result);
    } catch (err: any) {
      setError(`Unminify Error: ${err.message}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  };

  const loadSample = () => {
    if (lang === 'html') setInput('<div class="box"><h1>Title</h1><p>Content</p></div>');
    else if (lang === 'css') setInput('.box{color:red;display:flex;justify-content:center}');
    else if (lang === 'javascript') setInput('function test(a,b){return a+b}console.log(test(1,2));');
    else if (lang === 'json') setInput('{"a":1,"b":[2,3],"c":{"d":"val"}}');
    else if (lang === 'xml') setInput('<root><child attr="val">Content</child></root>');
    setOutput("");
    setError("");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4 flex items-center justify-center gap-3">
          <Maximize2 className="w-10 h-10 text-indigo-600" />
          Universal Unminifier
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Unpack and deobfuscate minified code (HTML, CSS, JS, JSON, XML).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
             <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-800">Input</h2>
                <select 
                    value={lang} 
                    onChange={(e) => setInput("") || setError("") || setOutput("") || setLang(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:border-indigo-500"
                >
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="javascript">JavaScript</option>
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                </select>
             </div>
            <button 
              onClick={loadSample}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
            >
              Load Sample
            </button>
          </div>
          
          <div className="p-4 grow flex flex-col">
            <textarea
              className="w-full grow p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none font-mono text-sm bg-gray-50 min-h-100"
              placeholder={`Paste minified ${lang.toUpperCase()} here...`}
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
                    onClick={unminify}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20"
                >
                    <Maximize2 className="w-4 h-4" /> Unminify
                </button>
            </div>

            {output && (
                 <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-indigo-600 transition-colors"
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
                        <h3 className="font-semibold text-red-900 mb-1">Unminify Error</h3>
                        <p className="text-red-600 text-sm font-mono break-all bg-white p-3 rounded-lg border border-red-100 mx-auto inline-block">
                            {error}
                        </p>
                    </div>
                </div>
             ) : (
                <textarea
                    readOnly
                    className="w-full grow p-4 rounded-xl border border-gray-200 text-gray-800 font-mono text-sm bg-white min-h-100 outline-none resize-none"
                    placeholder="Readable code will appear here..."
                    value={output}
                />
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
