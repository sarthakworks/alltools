import React, { useState, useEffect } from 'react';
import { Copy, Loader2, Sparkles, Wand2, AlertTriangle, MonitorPlay } from 'lucide-react';
import { cn } from '../../lib/utils';

// Helper for type safety with the experimental API
declare global {
  interface Window {
    ai?: {
      languageModel?: {
        capabilities: () => Promise<{ available: 'readily' | 'after-download' | 'no' }>;
        create: (options?: any) => Promise<{
          prompt: (text: string) => Promise<string>;
          destroy: () => void;
        }>;
      };
    };
  }
}

export default function AIWriterTool() {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [type, setType] = useState('article');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelStatus, setModelStatus] = useState<'checking' | 'ready' | 'downloading' | 'unavailable'>('checking');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    if (!window.ai || !window.ai.languageModel) {
      setModelStatus('unavailable');
      return;
    }

    try {
      const capabilities = await window.ai.languageModel.capabilities();
      if (capabilities.available === 'readily') {
        setModelStatus('ready');
      } else if (capabilities.available === 'after-download') {
        setModelStatus('downloading');
      } else {
        setModelStatus('unavailable');
      }
    } catch (e) {
      setModelStatus('unavailable');
    }
  };

  const generateContent = async () => {
    if (!topic || modelStatus !== 'ready') return;
    setIsGenerating(true);
    setResult('');
    setErrorMessage('');

    let session;
    try {
      // Create a session (this might trigger download if status was 'after-download', but we check 'ready' first)
      session = await window.ai!.languageModel!.create({
        systemPrompt: `You are a helpful AI writing assistant. user wants a ${tone} ${type}.`
      });

      const prompt = `Write a ${tone} ${type} about "${topic}". Make it engaging and well-structured.`;
      
      const stream = await session.prompt(prompt);
      setResult(stream);

    } catch (error: any) {
      console.error('Generation error:', error);
      setErrorMessage(error.message || 'Failed to generate content using offline model.');
    } finally {
      if (session) {
        session.destroy();
      }
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
              Offline Generator Settings
            </h3>
            <span className={cn("text-xs font-medium px-2 py-1 rounded-full border", 
              modelStatus === 'ready' ? "bg-green-50 text-green-700 border-green-200" :
              modelStatus === 'unavailable' ? "bg-red-50 text-red-700 border-red-200" :
              "bg-yellow-50 text-yellow-700 border-yellow-200"
            )}>
              {modelStatus === 'ready' ? 'Model Ready' : 
               modelStatus === 'checking' ? 'Checking CPU...' :
               modelStatus === 'downloading' ? 'Model Downloading...' : 'Browser Unsupported'}
            </span>
          </div>

          {modelStatus === 'unavailable' ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 space-y-3">
                  <div>
                    <p className="font-bold">Offline AI Not Detected</p>
                    <p>Status: {
                      !window.ai ? "'window.ai' is undefined (Flag disabled/Old Chrome)" : 
                      !window.ai.languageModel ? "'languageModel' API missing" : 
                      "Model capabilities check failed"
                    }</p>
                  </div>
                  
                  <div className="bg-white/50 p-3 rounded-lg border border-amber-100">
                    <p className="font-bold mb-2">Troubleshooting Steps:</p>
                    <ol className="list-decimal pl-4 space-y-2 opacity-90">
                      <li>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span><b>Flags:</b> Set to "Enabled":</span>
                          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-gray-200 text-[10px] font-mono select-all">
                            chrome://flags/#prompt-api-for-gemini-nano
                          </div>
                          <button 
                            onClick={() => navigator.clipboard.writeText('chrome://flags/#prompt-api-for-gemini-nano')}
                            className="p-1 hover:bg-black/5 rounded transition-colors"
                            title="Copy Link"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </li>
                      <li>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span><b>Model Download:</b> Check update at:</span>
                          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-gray-200 text-[10px] font-mono select-all">
                            chrome://components
                          </div>
                          <button 
                            onClick={() => navigator.clipboard.writeText('chrome://components')}
                            className="p-1 hover:bg-black/5 rounded transition-colors"
                            title="Copy Link"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <ul className="list-disc pl-4 text-xs space-y-0.5 mt-1">
                          <li>Find <b>Optimization Guide On Device Model</b></li>
                          <li>Click "Check for update"</li>
                          <li>Wait until Version is not <code>0.0.0.0</code></li>
                        </ul>
                      </li>
                      <li className="font-medium text-amber-900">Restart Chrome completely after these steps.</li>
                    </ol>
                  </div>

                  <button 
                    onClick={checkAvailability}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <MonitorPlay className="w-3 h-3" /> Re-check Availability
                  </button>
                </div>
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
                  </div>
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
                className="w-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" /> Generating (Offline)...
                  </>
                ) : (
                  <>
                    <MonitorPlay className="w-5 h-5" /> Generate Locally
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
              <p className="text-xs text-gray-400 mt-2">Runs locally on your device</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
