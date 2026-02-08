import React, { useState } from 'react';
import { Copy, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { cn, createAISession, streamAIResponse } from '../../common/utils';
import { useChromeAI } from '../../common/hooks/useChromeAI';
import { useCopyToClipboard } from '../../common/hooks/useCopyToClipboard';
import { AIUnavailableMessage } from '../../common/chromeAiUnavailableMsg';
import type { LanguageModelSession } from '../../common/types/chromeAI.types';
import '../../common/types/chromeAI.types';

export default function AIWriterTool() {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [type, setType] = useState('article');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Use custom hooks
  const { modelStatus, checkAvailability } = useChromeAI();
  const { copiedId, handleCopy } = useCopyToClipboard();



  const generateContent = async () => {
    if (!topic || modelStatus !== 'ready') return;
    setIsGenerating(true);
    setResult('');
    setErrorMessage('');

    let session: LanguageModelSession | undefined;
    try {
      // Create AI session using shared utility
      session = await createAISession({
        systemPrompt: `You are a helpful AI writing assistant. user wants a ${tone} ${type}.`
      });

      const prompt = `Write a ${tone} ${type} about "${topic}". Make it engaging and well-structured.`;
      
      // Stream response using shared utility
      await streamAIResponse(session, prompt, (chunk) => {
        setResult(prev => prev + chunk);
      });

    } catch (error: any) {
      console.error('Generation error:', error);
      setErrorMessage(error.message || 'Failed to generate content using offline model.');
    } finally {
      if (session) session.destroy();
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Content Writer
            </h3>
            <span className={cn("text-xs font-medium px-2 py-1 rounded-full border", 
              modelStatus === 'ready' ? "bg-green-50 text-green-700 border-green-200" :
              modelStatus === 'unavailable' ? "bg-red-50 text-red-700 border-red-200" :
              "bg-yellow-50 text-yellow-700 border-yellow-200"
            )}>
              {modelStatus === 'ready' ? "Model Ready" : 
               modelStatus === 'checking' ? "Checking System..." :
               modelStatus === 'downloading' ? "Downloading Model..." : "AI Unsupported"}
            </span>
          </div>

          {modelStatus === 'unavailable' ? (
            <AIUnavailableMessage onRecheck={checkAvailability} />
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">What do you want to write about?</label>
                <textarea 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. The future of artificial intelligence in web development"
                  rows={4}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Content Type</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none shadow-sm"
                  >
                    <option value="article">Article</option>
                    <option value="blog post">Blog Post</option>
                    <option value="email">Email</option>
                    <option value="social media caption">Social Caption</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tone</label>
                  <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none shadow-sm"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="informative">Informative</option>
                  </select>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {errorMessage}
                </div>
              )}

              <button
                onClick={generateContent}
                disabled={isGenerating || !topic || modelStatus !== 'ready'}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
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
              <span className="text-sm font-medium text-gray-500">Offline Result</span>
              <button 
                onClick={() => handleCopy(result, 'result-copy')}
                className={cn(
                  "text-xs font-medium flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-full cursor-pointer",
                  copiedId === 'result-copy' ? "bg-green-100 text-green-700" : "text-blue-600 hover:text-blue-700 bg-blue-50"
                )}
              >
                <Copy className="w-3.5 h-3.5" /> {copiedId === 'result-copy' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex-1 p-8 overflow-y-auto bg-white">
              <div className="prose prose-gray max-w-none">
                {result.split('\n').map((line, i) => (
                    <p key={i} className="mb-4 text-gray-600">{line}</p>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 p-8 text-center">
            <div>
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30 text-gray-400" />
              <p className="font-medium text-gray-500">Your content will appear here</p>
              <p className="text-xs text-gray-400 mt-2">Powered by local Gemini Nano</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}