import React, { useState, useEffect, useRef } from 'react';
import { Copy, Loader2, BookOpen, PenLine, AlertTriangle, Download, Terminal } from 'lucide-react';
import { pipeline, env } from '@huggingface/transformers';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

// Skip local check to force downloading from CDN if needed, 
// or set to true if you are hosting models locally.
env.allowLocalModels = false;
env.useBrowserCache = true;

export default function AIEssayWriter() {
  const { t } = useTranslation();
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('College');
  const [length, setLength] = useState('Medium (500 words)');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Model loading state
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [progress, setProgress] = useState<{ status: string; progress: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Keep the generator instance ref to avoid reloading
  const generatorRef = useRef<any>(null);

  const loadModel = async () => {
    if (generatorRef.current) {
      setModelStatus('ready');
      return;
    }

    try {
      setModelStatus('loading');
      setErrorMessage('');
      
      // Switching to Xenova/LaMini-Flan-T5-248M
      // This is a "gold standard" model for Transformers.js that is guaranteed to work.
      // It is an encoder-decoder model (~250MB).
      const generator = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-248M', {
        progress_callback: (x: any) => {
          // Handle different pipeline initialization stages
          if (x.status === 'initiate') {
            setProgress({ status: `Downloading ${x.file}...`, progress: 0 });
          } else if (x.status === 'progress') {
            setProgress({ status: `Downloading ${x.file}...`, progress: x.progress });
          } else if (x.status === 'done') {
            setProgress({ status: 'Model loaded!', progress: 100 });
          } else if (x.status === 'ready') {
             // Pipeline ready
          }
        }
      });
      
      generatorRef.current = generator;
      setModelStatus('ready');
      setProgress(null);
    } catch (e: any) {
      console.error(e);
      setModelStatus('error');
      setErrorMessage(e.message || "Failed to load the model. WebGPU might not be supported.");
    }
  };

  const generateEssay = async () => {
    if (!topic) return;

    // Load model first if not ready
    if (!generatorRef.current) {
      await loadModel();
      // If still failed, exit
      if (!generatorRef.current) return;
    }

    setIsGenerating(true);
    setResult('');
    setErrorMessage('');

    try {
      // LaMini prompt structure (Alpaca-style) often triggers refusals if too rigid.
      // We'll use a standard completion or simple Instruction bypassing "write an essay" triggers if possible.
      
      const cleanTopic = topic.replace(/^(write|create|make) (an )?essay (about|on|regarding)/i, '').trim();
      
      const fullPrompt = `Below is an instruction that describes a task. Write a response that appropriately completes the request.

### Instruction:
Write a short academic text about the following topic: ${cleanTopic}.
Ensure it has an introduction, body, and conclusion.

### Response:`;
      
      console.log("Generating with prompt:", fullPrompt);

      const output = await generatorRef.current(fullPrompt, {
        max_new_tokens: 600,
        temperature: 0.8, // Slightly higher creativity
        do_sample: true,
        repetition_penalty: 1.1,
        top_k: 50,
      });

      // text2text-generation returns 'generated_text' directly
      const generatedText = output[0].generated_text;
      
      setResult(generatedText);

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

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              {t('tools_ui.ai_essay_writer.title')}
            </h3>
            <span className={cn("text-xs font-medium px-2 py-1 rounded-full border", 
              modelStatus === 'ready' ? "bg-green-50 text-green-700 border-green-200" :
              modelStatus === 'loading' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
              "bg-gray-100 text-gray-700 border-gray-200"
            )}>
              {modelStatus === 'ready' ? 'Model Ready' : 
               modelStatus === 'loading' ? 'Downloading Model...' : 
               modelStatus === 'error' ? 'Error' : 'Offline Model'}
            </span>
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
               <p className="text-xs text-indigo-600">{t('tools_ui.ai_essay_writer.downloading_note')}</p>
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
                disabled={isGenerating || !topic || modelStatus === 'loading'}
                className="w-full bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" /> {t('tools_ui.ai_essay_writer.generating')}
                  </>
                ) : modelStatus === 'idle' ? (
                  <>
                     <Download className="w-5 h-5" /> {t('tools_ui.ai_essay_writer.download_and_generate')}
                  </>
                ) : (
                  <>
                    <PenLine className="w-5 h-5" /> {t('tools_ui.ai_essay_writer.generate_button')}
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
