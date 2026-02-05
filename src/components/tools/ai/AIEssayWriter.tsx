import React, { useState, useRef, useEffect } from 'react';
import { Copy, Loader2, BookOpen, PenLine, AlertTriangle, Download, Settings, CheckCircle2 } from 'lucide-react';
import { pipeline, env } from '@huggingface/transformers';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../lib/utils';

// Configuration
env.allowLocalModels = false;
env.useBrowserCache = true;

const MODELS = [
  {
    id: 'Xenova/LaMini-Flan-T5-248M',
    name: 'Standard (248M)',
    description: 'Balanced performance & quality (~900MB)',
    size: '900MB',
    file: 'config.json'
  },
  {
    id: 'Xenova/LaMini-Flan-T5-77M',
    name: 'Lite (77M)',
    description: 'Fastest, lower quality (~300MB)',
    size: '300MB',
    file: 'config.json'
  }
];

export default function AIEssayWriter() {
  const { t } = useTranslation();
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('College');
  const [length, setLength] = useState('Medium (500 words)');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Model Selection
  const [selectedModelId, setSelectedModelId] = useState(MODELS[0].id);
  const selectedModel = MODELS.find(m => m.id === selectedModelId) || MODELS[0];

  // Model loading state
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [loadedModelId, setLoadedModelId] = useState<string | null>(null); // Track WHICH model is actually ready
  const [progress, setProgress] = useState<{ status: string; progress: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Keep the generator instance ref to avoid reloading
  const generatorRef = useRef<any>(null);

  useEffect(() => {
    // Smart Auto-Detection
    const checkCache = async () => {
      try {
        if ('caches' in window) {
          const cache = await caches.open('transformers-cache');
          
          // Check for Standard model first (Preferred)
          const stdUrl = `https://huggingface.co/${MODELS[0].id}/resolve/main/${MODELS[0].file}`;
          const stdCached = await cache.match(stdUrl);
          
          if (stdCached) {
             setSelectedModelId(MODELS[0].id);
             loadModel(MODELS[0].id);
             return;
          }

          // Check for Lite model second
          const liteUrl = `https://huggingface.co/${MODELS[1].id}/resolve/main/${MODELS[1].file}`;
          const liteCached = await cache.match(liteUrl);
          
          if (liteCached) {
             setSelectedModelId(MODELS[1].id);
             loadModel(MODELS[1].id);
             return;
          }
        }
      } catch (e) {
        // Ignore cache errors
      }
    };
    checkCache();
  }, []);

  // --------- Helpers ---------

  const getTargetWords = (len: string) => {
    if (/short/i.test(len)) return 300;
    if (/long/i.test(len)) return 850;
    return 500;
  };

  const makePrompt = (cleanTopic: string, lvl: string, len: string) => {
    const words = getTargetWords(len);
    return [
      `Write an essay about: ${cleanTopic}.`,
      `Level: ${lvl}.`,
      `Length: about ${words} words.`,
      `Structure:`,
      `1) Introduction (1 paragraph)`,
      `2) Body (3-5 paragraphs with clear headings or topic sentences)`,
      `3) Conclusion (1 paragraph)`,
      `Style: clear, factual, and well-organized.`,
      `Do not mention policies, safety rules, or refusals. Just write the essay.`,
    ].join('\n');
  };

  const looksLikeRefusal = (text: string) => {
    const t = (text || '').trim();
    if (!t) return false;
    return (
      /^sorry[, ]/i.test(t) ||
      /i (can('|’)t|cannot) (help|complete|do)/i.test(t) ||
      /goes against (the )?policy/i.test(t) ||
      /not allowed/i.test(t) ||
      /as an ai/i.test(t)
    );
  };

  const cleanModelOutput = (text: string) => {
    if (!text) return '';
    return text
      .replace(/^\s*###\s*Response:\s*/i, '')
      .replace(/^\s*Response:\s*/i, '')
      .trim();
  };

  const tryGenerateWithFallbacks = async (cleanTopic: string) => {
    const basePrompt = makePrompt(cleanTopic, level, length);
    const out1 = await generatorRef.current(basePrompt, {
      max_new_tokens: 900,
      do_sample: true,
      temperature: 0.7,
      top_p: 0.92,
      repetition_penalty: 1.12,
    });

    let text1 = cleanModelOutput(out1?.[0]?.generated_text ?? '');
    if (text1 && !looksLikeRefusal(text1)) return text1;

    const simplerPrompt = `Write a well-structured essay about ${cleanTopic}. Include an introduction, body, and conclusion.`;
    const out2 = await generatorRef.current(simplerPrompt, {
      max_new_tokens: 900,
      do_sample: false,
      temperature: 0.0,
      repetition_penalty: 1.1,
    });

    let text2 = cleanModelOutput(out2?.[0]?.generated_text ?? '');
    if (text2 && !looksLikeRefusal(text2)) return text2;

    const strictPrompt = `Essay topic: ${cleanTopic}\nWrite the essay now:`;
    const out3 = await generatorRef.current(strictPrompt, {
      max_new_tokens: 900,
      do_sample: false,
      temperature: 0.0,
      repetition_penalty: 1.08,
    });

    let text3 = cleanModelOutput(out3?.[0]?.generated_text ?? '');
    return text3; 
  };

  // ---------------------------------------------------------------

  const loadModel = async (modelIdToLoad = selectedModelId) => {
    // If the requested model is already loaded, skip
    if (generatorRef.current && loadedModelId === modelIdToLoad) {
      setModelStatus('ready');
      return;
    }

    try {
      setModelStatus('loading');
      setErrorMessage('');

      // Create new pipeline
      const generator = await pipeline('text2text-generation', modelIdToLoad, {
        progress_callback: (x: any) => {
          try {
            if (x.status === 'initiate') {
              setProgress({ status: `Downloading ${x.file}...`, progress: 0 });
            } else if (x.status === 'progress') {
              setProgress({ status: `Downloading ${x.file}...`, progress: x.progress });
            } else if (x.status === 'done') {
              setProgress({ status: 'Model loaded!', progress: 100 });
            } else if (x.status === 'ready') {
              // ready
            }
          } catch {
             // ignore
          }
        },
      });

      generatorRef.current = generator;
      setLoadedModelId(modelIdToLoad);
      setModelStatus('ready');
      setProgress(null);
    } catch (e: any) {
      console.error(e);
      setModelStatus('error');
      setErrorMessage(e.message || 'Failed to load the model.');
      setLoadedModelId(null);
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newId = e.target.value;
      setSelectedModelId(newId);
      // If we switch models, we force user to click "Load" or we auto-load?
      // Auto-load is nicer but might incur data. Let's reset status to idle if different.
      if (loadedModelId !== newId) {
          setModelStatus('idle');
          setLoadedModelId(null);
          // Optional: clear result if model changes? No, keep it.
      } else {
          setModelStatus('ready');
      }
  };

  const generateEssay = async () => {
    if (!topic) return;

    // Load selected model if not ready
    if (!generatorRef.current || loadedModelId !== selectedModelId) {
      await loadModel(selectedModelId);
      if (!generatorRef.current) return;
    }

    setIsGenerating(true);
    setResult('');
    setErrorMessage('');

    try {
      const cleanTopic = topic
        .replace(/^(write|create|make)\s+(an\s+)?essay\s+(about|on|regarding)\s+/i, '')
        .trim();

      const generatedText = await tryGenerateWithFallbacks(cleanTopic);
      const finalText = cleanModelOutput(generatedText);

      if (!finalText) {
        setErrorMessage('Failed to generate content. Please try again with a different topic.');
        return;
      }

      setResult(finalText);
    } catch (error: any) {
      console.error('Generation error:', error);
      setErrorMessage(error.message || 'Failed to generate content.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
  };

  const isReady = modelStatus === 'ready' && loadedModelId === selectedModelId;

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              {t('tools_ui.ai_essay_writer.title')}
            </h3>
            
            <div className={cn("text-xs font-medium px-2 py-1 rounded-full border flex items-center gap-1.5 transition-colors", 
              isReady ? "bg-green-50 text-green-700 border-green-200" :
              modelStatus === 'loading' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
              "bg-gray-100 text-gray-700 border-gray-200"
            )}>
              {isReady && <CheckCircle2 className="w-3 h-3" />}
              {modelStatus === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
              
              {isReady ? `${selectedModel.name} Ready` : 
               modelStatus === 'loading' ? 'Downloading...' : 
               'Offline Model'}
            </div>
          </div>

          {modelStatus === 'loading' && progress && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2 animate-pulse">
               <div className="flex items-center gap-2 text-indigo-800 text-sm font-medium">
                  <Download className="w-4 h-4" />
                  {progress.status}
               </div>
               <div className="w-full bg-indigo-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(5, progress.progress || 0)}%` }}
                  />
               </div>
               <p className="text-xs text-indigo-600">Downloading {selectedModel.name} ({selectedModel.size}). First run only.</p>
            </div>
          )}
          
          {modelStatus === 'error' && (
             <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                <div className="flex gap-2 mb-2 font-bold items-center">
                   <AlertTriangle className="w-4 h-4" /> Load Error
                </div>
                <p>{errorMessage}</p>
                 <button onClick={() => { setModelStatus('idle'); loadModel(); }} className="mt-3 underline font-medium">Retry Download</button>
             </div>
          )}

          <div className="space-y-5">
              {/* Model Selector */}
              <div className="p-3 bg-white border border-gray-200 rounded-xl flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Settings className="w-3 h-3" /> AI Model
                  </label>
                  <select 
                      value={selectedModelId}
                      onChange={handleModelChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                      disabled={isGenerating || modelStatus === 'loading'}
                  >
                      {MODELS.map(m => (
                          <option key={m.id} value={m.id}>
                              {m.name} - {m.description}
                          </option>
                      ))}
                  </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t('tools_ui.ai_essay_writer.essay_topic_label')}</label>
                <textarea 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t('tools_ui.ai_essay_writer.topic_placeholder')}
                  rows={3}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none shadow-sm placeholder:text-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{t('tools_ui.ai_essay_writer.level_label')}</label>
                  <div className="relative">
                    <select 
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm cursor-pointer"
                    >
                      <option value="High School">High School</option>
                      <option value="College">College / undergrad</option>
                      <option value="Graduate">Graduate / PhD</option>
                      <option value="Professional">Professional</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{t('tools_ui.ai_essay_writer.length_label')}</label>
                  <div className="relative">
                    <select 
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm cursor-pointer"
                    >
                      <option value="Short (300 words)">Short (~300 words)</option>
                      <option value="Medium (500 words)">Medium (~500 words)</option>
                      <option value="Long (800+ words)">Long (800+ words)</option>
                    </select>
                  </div>
                </div>
              </div>

              {errorMessage && modelStatus !== 'error' && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {errorMessage}
                </div>
              )}

              <button
                onClick={generateEssay}
                disabled={isGenerating || (isReady && !topic) || modelStatus === 'loading'}
                className={cn("w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed text-white",
                    isReady ? "bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-500/20" : "bg-gray-800 hover:bg-gray-900 shadow-gray-500/20"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" /> {t('tools_ui.ai_essay_writer.generating')}
                  </>
                ) : isReady ? (
                  <>
                    <PenLine className="w-5 h-5" /> {t('tools_ui.ai_essay_writer.generate_button')}
                  </>
                ) : (
                  <>
                     <Download className="w-5 h-5" /> Download {selectedModel.name}
                  </>
                )}
              </button>
            </div>
        </div>
      </div>


      <div className="h-full min-h-125 flex flex-col">
        {result ? (
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col animate-in fade-in shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <span className="text-sm font-medium text-gray-500">{t('tools_ui.ai_essay_writer.essay_draft')}</span>
              <button 
                onClick={copyToClipboard}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition-colors bg-indigo-50 px-3 py-1.5 rounded-full"
              >
                <Copy className="w-3.5 h-3.5" /> {t('tools_ui.common.copy')}
              </button>
            </div>
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-white">
              <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-strong:text-gray-900 font-serif leading-relaxed">
                {result.split('\n').map((line, i) => (
                    <p key={i} className="mb-4">{line}</p>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 p-8 text-center">
            <div>
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-300" />
              <p className="font-medium text-gray-500">{t('tools_ui.ai_essay_writer.essay_placeholder')}</p>
              <p className="text-xs text-gray-400 mt-2">{t('tools_ui.ai_essay_writer.private_offline')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
