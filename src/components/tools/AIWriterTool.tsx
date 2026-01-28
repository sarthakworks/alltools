import React, { useState, useEffect } from 'react';
import { Copy, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AIWriterTool() {
  const [apiKey, setApiKey] = useState('');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [type, setType] = useState('article');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(true);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setShowKeyInput(false);
    }
  }, []);

  const saveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey);
      setShowKeyInput(false);
    }
  };

  const clearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setShowKeyInput(true);
  };

  const generateContent = async () => {
    if (!apiKey || !topic) return;
    setIsGenerating(true);
    setResult('');

    try {
      // Using Gemini API (Google Generative AI) REST endpoint for lightweight client usage
      const prompt = `Write a ${tone} ${type} about "${topic}". Make it engaging and well-structured.`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setResult(text);
      } else {
        throw new Error('No content generated');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Generator Settings
            </h3>
            {!showKeyInput && (
              <button onClick={clearKey} className="text-xs text-gray-500 hover:text-red-500 font-medium transition-colors">
                Change API Key
              </button>
            )}
          </div>

          {showKeyInput ? (
            <div className="space-y-4 p-5 bg-white rounded-xl border border-gray-200 shadow-inner">
              <label className="text-sm font-medium text-gray-900 block">
                Enter Gemini API Key
                <span className="block text-xs text-gray-500 mt-1 font-normal">
                  Your key is stored locally in your browser. Get one free from Google AI Studio.
                </span>
              </label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-gray-400"
                />
                <button 
                  onClick={saveKey}
                  disabled={!apiKey}
                  className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Topic / Prompt</label>
                <textarea 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What should I write about?"
                  rows={4}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none shadow-sm placeholder:text-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <div className="relative">
                    <select 
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none shadow-sm cursor-pointer"
                    >
                      <option value="article">Article</option>
                      <option value="blog post">Blog Post</option>
                      <option value="email">Email</option>
                      <option value="social media caption">Social Caption</option>
                      <option value="story">Story</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tone</label>
                  <div className="relative">
                    <select 
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none shadow-sm cursor-pointer"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="enthusiastic">Enthusiastic</option>
                      <option value="informative">Informative</option>
                      <option value="funny">Funny</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={generateContent}
                disabled={isGenerating || !topic}
                className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transform active:scale-95"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" /> Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" /> Generate Content
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="h-full min-h-125 flex flex-col">
        {result ? (
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col animate-in fade-in shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <span className="text-sm font-medium text-gray-500">Generated Result</span>
              <button 
                onClick={copyToClipboard}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors bg-blue-50 px-3 py-1.5 rounded-full"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-white">
              <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-strong:text-gray-900">
                {result.split('\n').map((line, i) => (
                    <p key={i} className="mb-4">{line}</p>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 p-8 text-center">
            <div>
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-300" />
              <p className="font-medium text-gray-500">AI generated content will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
