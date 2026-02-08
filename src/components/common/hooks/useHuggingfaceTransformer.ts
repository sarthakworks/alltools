import { useState, useRef, useEffect } from 'react';
import { pipeline, env } from '@huggingface/transformers';

// Configuration
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface TransformerModel {
  id: string;
  name: string;
  description: string;
  size: string;
  file: string;
}

export interface GenerationOptions {
  max_new_tokens?: number;
  do_sample?: boolean;
  temperature?: number;
  top_p?: number;
  repetition_penalty?: number;
}

export interface ProgressInfo {
  status: string;
  progress: number;
}

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Custom hook for managing Hugging Face Transformer models
 * 
 * @param models - Array of available models to choose from
 * @param defaultModelId - Optional default model ID to use
 * @returns Object containing model state and control functions
 * 
 * @example
 * const MODELS = [
 *   { id: 'Xenova/LaMini-Flan-T5-248M', name: 'Standard', description: '...', size: '900MB', file: 'config.json' }
 * ];
 * 
 * const {
 *   selectedModelId,
 *   setSelectedModelId,
 *   modelStatus,
 *   loadedModelId,
 *   progress,
 *   errorMessage,
 *   loadModel,
 *   generate,
 *   isReady
 * } = useHuggingfaceTransformer(MODELS);
 */
export function useHuggingfaceTransformer(
  models: TransformerModel[],
  defaultModelId?: string
) {
  const [selectedModelId, setSelectedModelId] = useState(
    defaultModelId || models[0]?.id || ''
  );
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle');
  const [loadedModelId, setLoadedModelId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const generatorRef = useRef<any>(null);

  /**
   * Auto-detect cached models on mount
   */
  useEffect(() => {
    const checkCache = async () => {
      try {
        if ('caches' in window) {
          const cache = await caches.open('transformers-cache');

          // Check each model in order of preference
          for (const model of models) {
            const url = `https://huggingface.co/${model.id}/resolve/main/${model.file}`;
            const cached = await cache.match(url);

            if (cached) {
              setSelectedModelId(model.id);
              loadModel(model.id);
              return;
            }
          }
        }
      } catch (e) {
        // Ignore cache errors
      }
    };

    checkCache();
  }, []);

  /**
   * Load a transformer model
   */
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

  /**
   * Generate text using the loaded model
   */
  const generate = async (
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<string> => {
    if (!generatorRef.current) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    const result = await generatorRef.current(prompt, {
      max_new_tokens: 500,
      do_sample: true,
      temperature: 0.7,
      ...options,
    });

    return result?.[0]?.generated_text ?? '';
  };

  /**
   * Handle model selection change
   */
  const handleModelChange = (newModelId: string) => {
    setSelectedModelId(newModelId);
    if (loadedModelId !== newModelId) {
      setModelStatus('idle');
      setLoadedModelId(null);
    } else {
      setModelStatus('ready');
    }
  };

  const isReady = modelStatus === 'ready' && loadedModelId === selectedModelId;

  return {
    // State
    selectedModelId,
    modelStatus,
    loadedModelId,
    progress,
    errorMessage,
    isReady,

    // Actions
    setSelectedModelId: handleModelChange,
    loadModel,
    generate,
    
    // Direct access to generator (for advanced use cases)
    generatorRef,
  };
}
