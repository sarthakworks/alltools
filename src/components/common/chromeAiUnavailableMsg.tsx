import React from 'react';
import { AlertTriangle, MonitorPlay, Copy } from 'lucide-react';
import { cn } from './utils';
import { useCopyToClipboard } from './hooks/useCopyToClipboard';

interface AIUnavailableMessageProps {
  onRecheck: () => void;
}

/**
 * Reusable component displaying Chrome AI setup instructions
 * when the AI model is unavailable
 */
export function AIUnavailableMessage({ onRecheck }: AIUnavailableMessageProps) {
  const { copiedId, handleCopy } = useCopyToClipboard();

  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-4">
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 space-y-4">
          <div>
            <p className="font-bold text-base mb-1">Chrome Built-in AI Not Detected</p>
            <p className="text-xs opacity-90">Please ensure Gemini Nano is enabled in your browser settings.</p>
          </div>
          
          <div className="bg-white/70 p-4 rounded-lg border border-amber-100 space-y-3">
            <div>
              <p className="font-bold mb-2 text-amber-900">📋 System Requirements</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><b>Browser:</b> Chrome 138+</li>
                <li><b>Storage:</b> 22GB+ free space</li>
                <li><b>Hardware:</b> GPU with 4GB+ VRAM</li>
              </ul>
            </div>

            <div>
              <p className="font-bold mb-2 text-amber-900">⚙️ Step 1: Enable Flags</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px]">Open:</span>
                  <code className="bg-white px-2 py-0.5 border rounded text-[10px] select-all">chrome://flags</code>
                  <button 
                    onClick={() => handleCopy('chrome://flags', 'flags-url')}
                    className={cn(
                      "p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-medium",
                      copiedId === 'flags-url' ? "bg-green-100 text-green-700" : "hover:bg-black/5 text-gray-600"
                    )}
                    title={copiedId === 'flags-url' ? 'Copied!' : 'Copy URL'}
                  >
                    <Copy className="w-3 h-3" />
                    {copiedId === 'flags-url' && <span>Copied!</span>}
                  </button>
                </div>
                <ul className="list-disc pl-5 text-[10px] space-y-1">
                  <li>
                    <code>#optimization-guide-on-device-model</code> → Set to <b>Enabled BypassPerfRequirement</b>
                    <button 
                      onClick={() => handleCopy('chrome://flags/#optimization-guide-on-device-model', 'flag-1')}
                      className={cn(
                        "ml-1 p-0.5 rounded inline-flex items-center gap-0.5 cursor-pointer text-[9px] font-medium",
                        copiedId === 'flag-1' ? "bg-green-100 text-green-700" : "hover:bg-black/5 text-gray-600"
                      )}
                      title={copiedId === 'flag-1' ? 'Copied!' : 'Copy flag URL'}
                    >
                      <Copy className="w-2.5 h-2.5" />
                      {copiedId === 'flag-1' && <span>✓</span>}
                    </button>
                  </li>
                  <li>
                    <code>#prompt-api-for-gemini-nano</code> → Set to <b>Enabled</b>
                    <button 
                      onClick={() => handleCopy('chrome://flags/#prompt-api-for-gemini-nano', 'flag-2')}
                      className={cn(
                        "ml-1 p-0.5 rounded inline-flex items-center gap-0.5 cursor-pointer text-[9px] font-medium",
                        copiedId === 'flag-2' ? "bg-green-100 text-green-700" : "hover:bg-black/5 text-gray-600"
                      )}
                      title={copiedId === 'flag-2' ? 'Copied!' : 'Copy flag URL'}
                    >
                      <Copy className="w-2.5 h-2.5" />
                      {copiedId === 'flag-2' && <span>✓</span>}
                    </button>
                  </li>
                </ul>
                <p className="text-[10px] text-amber-700 mt-1">Then click <b>Relaunch</b> at the bottom</p>
              </div>
            </div>

            <div>
              <p className="font-bold mb-2 text-amber-900">📥 Step 2: Download Model</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px]">Open:</span>
                  <code className="bg-white px-2 py-0.5 border rounded text-[10px] select-all">chrome://components</code>
                  <button 
                    onClick={() => handleCopy('chrome://components', 'components-url')}
                    className={cn(
                      "p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-medium",
                      copiedId === 'components-url' ? "bg-green-100 text-green-700" : "hover:bg-black/5 text-gray-600"
                    )}
                    title={copiedId === 'components-url' ? 'Copied!' : 'Copy URL'}
                  >
                    <Copy className="w-3 h-3" />
                    {copiedId === 'components-url' && <span>Copied!</span>}
                  </button>
                </div>
                <ul className="list-disc pl-5 text-[10px] space-y-0.5">
                  <li>Find <b>Optimization Guide On Device Model</b></li>
                  <li>Click <b>"Check for update"</b></li>
                  <li>Wait until version changes from <code className="bg-white px-1 rounded">0.0.0.0</code> to a real version (~1.5-4GB download)</li>
                </ul>
              </div>
            </div>

            <div>
              <p className="font-bold mb-2 text-amber-900">🔍 Step 3: Verify Model is Loaded</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px]">Open:</span>
                  <code className="bg-white px-2 py-0.5 border rounded text-[10px] select-all">chrome://on-device-internals</code>
                  <button 
                    onClick={() => handleCopy('chrome://on-device-internals', 'internals-url')}
                    className={cn(
                      "p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-medium",
                      copiedId === 'internals-url' ? "bg-green-100 text-green-700" : "hover:bg-black/5 text-gray-600"
                    )}
                    title={copiedId === 'internals-url' ? 'Copied!' : 'Copy URL'}
                  >
                    <Copy className="w-3 h-3" />
                    {copiedId === 'internals-url' && <span>Copied!</span>}
                  </button>
                </div>
                <ul className="list-disc pl-5 text-[10px] space-y-0.5">
                  <li>If it shows <b>"disabled"</b>, enable it by following on-screen steps</li>
                  <li>After enabling, open in a <b>new tab</b> (don't reload existing tab)</li>
                  <li>Look for the <b>Model Status</b> tab</li>
                  <li>Check if model is listed as <b>Ready</b> or <b>Loaded</b></li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 p-2 rounded mt-1">
                  <p className="text-[9px] text-amber-800">
                    <b>If model not Ready:</b> Run <code className="bg-white px-1 rounded">await LanguageModel.create();</code> in console several times to nudge Chrome to finish installation.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="font-bold mb-2 text-amber-900">✅ Step 4: Final Test</p>
              <div className="space-y-1">
                <p className="text-[10px]">Open DevTools Console (F12) and run:</p>
                <code className="block bg-white px-2 py-1 rounded text-[9px] select-all mt-1">
                  await LanguageModel.availability();
                </code>
                <p className="text-[10px] mt-1">Should return: <code className="bg-green-100 text-green-800 px-1 rounded text-[9px]">"available"</code></p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg">
              <p className="font-bold mb-1 text-blue-900 text-[10px]">💡 Troubleshooting</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[9px] text-blue-800">
                <li>Click anywhere on page before testing in console</li>
                <li>Restart Chrome completely after setup</li>
                <li>Doesn't work in Incognito mode</li>
              </ul>
            </div>
          </div>

          <button 
            onClick={onRecheck}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <MonitorPlay className="w-4 h-4" /> Recheck Availability
          </button>
        </div>
      </div>
    </div>
  );
}
