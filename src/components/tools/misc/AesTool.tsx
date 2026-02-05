import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import { Copy, Lock, Unlock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../../../i18n';

// Types and Enums
const MODES = {
  CBC: CryptoJS.mode.CBC,
  ECB: CryptoJS.mode.ECB,
  CFB: CryptoJS.mode.CFB,
  OFB: CryptoJS.mode.OFB,
  CTR: CryptoJS.mode.CTR,
};

const PADDINGS = {
  PKCS5: CryptoJS.pad.Pkcs7,
  Pkcs7: CryptoJS.pad.Pkcs7,
  Iso97971: CryptoJS.pad.Iso97971,
  AnsiX923: CryptoJS.pad.AnsiX923,
  Iso10126: CryptoJS.pad.Iso10126,
  ZeroPadding: CryptoJS.pad.ZeroPadding,
  NoPadding: CryptoJS.pad.NoPadding,
};

interface State {
  text: string;
  mode: keyof typeof MODES;
  padding: keyof typeof PADDINGS;
  iv: string;
  keySize: string;
  secret: string;
  format: 'Base64' | 'Hex' | 'Utf8';
  inputFormat: 'Base64' | 'Hex';
  output: string;
  error: string;
  keyType: 'Passphrase' | 'Utf8';
}

const defaultState: State = {
  text: "",
  mode: "CBC",
  padding: "Pkcs7",
  iv: "",
  keySize: "128",
  secret: "",
  format: "Base64",
  inputFormat: "Base64",
  output: "",
  error: "",
  keyType: "Utf8",
};

export default function AesTool() {
  const { t } = useTranslation();
  const [encState, setEncState] = useState<State>({ ...defaultState });
  const [decState, setDecState] = useState<State>({ ...defaultState, format: "Utf8" });

  const process = (isEncrypt: boolean) => {
    const state = isEncrypt ? encState : decState;
    const setter = isEncrypt ? setEncState : setDecState;

    setter((prev) => ({ ...prev, error: "", output: "" }));

    if (!state.text || !state.secret) {
      setter((prev) => ({
        ...prev,
        error: t('tools_ui.aes_tool.validation_error'),
      }));
      return;
    }

    try {
      const keyConfig: any = {
        mode: MODES[state.mode],
        padding: PADDINGS[state.padding],
      };
      
      if (state.iv && state.mode !== "ECB") {
        keyConfig.iv = CryptoJS.enc.Utf8.parse(state.iv);
      }

      // Handle Key parsing
      let parsedKey: any = state.secret;
      if (state.keyType === "Utf8") {
        parsedKey = CryptoJS.enc.Utf8.parse(state.secret);
      }
      // If Passphrase, crypto-js handles it automatically as string

      let result;
      if (isEncrypt) {
        const encrypted = CryptoJS.AES.encrypt(
          state.text,
          parsedKey,
          keyConfig
        );
        result = state.format === "Base64"
            ? encrypted.toString()
            : encrypted.ciphertext.toString(CryptoJS.enc.Hex);
      } else {
        let cipherParams: any = state.text;
        
        // Handle Hex Input
        if (state.inputFormat === 'Hex') {
            const cipherTextHex = CryptoJS.enc.Hex.parse(state.text.replace(/\s/g, ''));
            cipherParams = { ciphertext: cipherTextHex };
        } 
        // Note: For Base64, passing the string directly works as CryptoJS assumes Base64.
        // But strictly speaking, it's safer to pass CipherParams if we want to be explicit,
        // but passing string is standard API for Base64 ciphertext.

        const decrypted = CryptoJS.AES.decrypt(
          cipherParams,
          parsedKey,
          keyConfig
        );
        
        // Basic check for successful decryption
        const decryptedUtf8 = decrypted.toString(CryptoJS.enc.Utf8);
        
        result = state.format === "Base64"
            ? decrypted.toString(CryptoJS.enc.Base64)
            : decryptedUtf8;
            
        if (!result && decrypted.sigBytes > 0 && state.format === 'Utf8') {
             // It might be binary data that failed UTF8 parsing
        }
      }
      
      if (!result && state.text) {
          // It could be just empty string encryption, but likely an issue if input wasn't empty
      }

      setter((prev) => ({ ...prev, output: result }));
    } catch (err: any) {
      let errorMessage = err.message || "Operation failed.";

      // Map common technical errors to user-friendly messages
      if (errorMessage.includes("Malformed UTF-8")) {
        errorMessage = t('tools_ui.aes_tool.error_malformed');
      } else if (errorMessage.toLowerCase().includes("cannot read properties of undefined")) {
        errorMessage = t('tools_ui.aes_tool.error_config');
      } else if (errorMessage === "Operation failed.") {
        errorMessage = t('tools_ui.aes_tool.error_operation');
      }
      else{
        errorMessage = err.message ||"Operation failed.";
      }

      setter((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      console.error(err);
    }
  };

  const updateState = (setter: React.Dispatch<React.SetStateAction<State>>, key: keyof State, value: any) => {
      setter(prev => ({ ...prev, [key]: value }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">{t('tools_ui.aes_tool.title')}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('tools_ui.aes_tool.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Encryption Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-50/50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" /> {t('tools_ui.aes_tool.encrypt_title')}
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('tools_ui.aes_tool.encrypt_input_label')}</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-y min-h-30"
                placeholder={t('tools_ui.aes_tool.input_placeholder')}
                value={encState.text}
                onChange={(e) => updateState(setEncState, "text", e.target.value)}
              />
            </div>

            <CommonOptions prefix="enc" state={encState} setter={setEncState} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('tools_ui.aes_tool.output_format')}</label>
              <div className="flex gap-4">
                {["Base64", "Hex"].map((fmt) => (
                  <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="encFormat"
                      value={fmt}
                      checked={encState.format === fmt}
                      onChange={() => updateState(setEncState, "format", fmt)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{fmt}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => process(true)}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" /> {t('tools_ui.common.encrypt')}
            </button>

            {encState.error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                {encState.error}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">{t('tools_ui.aes_tool.encrypted_output')}</label>
                 {encState.output && (
                  <button 
                    onClick={() => copyToClipboard(encState.output)}
                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> {t('tools_ui.common.copy')}
                  </button>
                 )}
              </div>
              <textarea
                readOnly
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 resize-y min-h-30 font-mono text-sm"
                placeholder={t('tools_ui.common.result_placeholder')}
                value={encState.output}
              />
            </div>
          </div>
        </div>

        {/* Decryption Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-green-50/50 px-6 py-4 border-b border-green-100 flex items-center justify-between">
             <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-green-600" /> {t('tools_ui.aes_tool.decrypt_title')}
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('tools_ui.aes_tool.decrypt_input_label')}</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none resize-y min-h-30"
                placeholder={t('tools_ui.aes_tool.decrypt_placeholder')}
                value={decState.text}
                onChange={(e) => updateState(setDecState, "text", e.target.value)}
              />
            </div>

            <CommonOptions prefix="dec" state={decState} setter={setDecState} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('tools_ui.aes_tool.input_format')}</label>
                   <div className="flex gap-4">
                    {["Base64", "Hex"].map((fmt) => (
                      <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="decInputFormat"
                          value={fmt}
                          checked={decState.inputFormat === fmt}
                          onChange={() => updateState(setDecState, "inputFormat", fmt)}
                          className="w-4 h-4 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">{fmt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('tools_ui.aes_tool.output_format')}</label>
                   <div className="flex gap-4">
                    {["Utf8", "Base64"].map((fmt) => (
                      <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="decFormat"
                          value={fmt}
                          checked={decState.format === fmt}
                          onChange={() => updateState(setDecState, "format", fmt)}
                          className="w-4 h-4 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">{fmt === 'Utf8' ? 'Plain Text' : fmt}</span>
                      </label>
                    ))}
                  </div>
                </div>
            </div>

            <button
              onClick={() => process(false)}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" /> {t('tools_ui.common.decrypt')}
            </button>

            {decState.error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                {decState.error}
              </div>
            )}

            <div>
               <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">{t('tools_ui.aes_tool.decrypted_output')}</label>
                 {decState.output && (
                  <button 
                    onClick={() => copyToClipboard(decState.output)}
                    className="text-xs flex items-center gap-1 text-green-600 hover:text-green-700 font-medium cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> {t('tools_ui.common.copy')}
                  </button>
                 )}
              </div>
              <textarea
                readOnly
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 resize-y min-h-30 font-mono text-sm"
                placeholder={t('tools_ui.common.result_placeholder')}
                value={decState.output}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CommonOptions = ({ prefix, state, setter }: { prefix: string, state: State, setter: React.Dispatch<React.SetStateAction<State>> }) => {
  const isECB = state.mode === "ECB";
  const isStreamCipher = ["CFB", "OFB", "CTR"].includes(state.mode);
  
  const updateState = (key: keyof State, value: any) => {
    setter(prev => {
        const newState = { ...prev, [key]: value };
        
        // Auto-correct combinations when mode changes
        if (key === 'mode') {
             if (["CFB", "OFB", "CTR"].includes(value)) {
                 newState.padding = 'NoPadding';
             } else {
                 // Default back to Pkcs7 if switching back to block cipher and currently NoPadding?
                 // Or keep user selection if valid? 
                 // It's better UX to reset to a safe default like Pkcs7 if coming from NoPadding which might fail for CBC
                 if (newState.padding === 'NoPadding') {
                     newState.padding = 'Pkcs7';
                 }
             }
        }
        return newState;
    });
  };

  return (
    <div className="space-y-4">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cipher Mode</label>
            <select
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={state.mode}
                onChange={(e) => updateState("mode", e.target.value)}
            >
                {Object.keys(MODES).map((m) => (
                <option key={m} value={m}>{m}</option>
                ))}
            </select>
        </div>
        
        {!isStreamCipher && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Padding</label>
                <select
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={state.padding}
                    onChange={(e) => updateState("padding", e.target.value)}
                >
                    {Object.keys(PADDINGS).map((p) => (
                    <option key={p} value={p}>{p}</option>
                    ))}
                </select>
            </div>
        )}
      </div>

       {!isECB && (
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IV (Initialization Vector)</label>
            <input
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                placeholder="Optional (16 chars)"
                value={state.iv}
                onChange={(e) => updateState("iv", e.target.value)}
            />
          </div>
       )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key Size (Bits)</label>
            <select
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={state.keySize}
                onChange={(e) => updateState("keySize", e.target.value)}
            >
                {["128", "192", "256"].map((s) => (
                <option key={s} value={s}>{s}</option>
                ))}
            </select>
          </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Secret Key 
            {state.keyType === 'Utf8' && (
                <span className="text-gray-500 font-normal ml-1">
                    (requires {parseInt(state.keySize) / 8} chars)
                </span>
            )}
        </label>
        <div className="relative">
            <input
                type="text"
                className="w-full pl-3 pr-16 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                placeholder="Enter secret key"
                value={state.secret}
                onChange={(e) => updateState("secret", e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                {state.secret.length} chars
            </div>
        </div>
        
        <div className="flex items-center gap-4 mt-2">
             <span className="text-xs text-gray-500 font-medium">Treat Key As:</span>
             <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                    type="radio"
                    name={`${prefix}-keyType`}
                    value="Passphrase"
                    checked={state.keyType === "Passphrase"}
                    onChange={() => updateState("keyType", "Passphrase")}
                    className="w-3.5 h-3.5 text-blue-600"
                />
                <span className="text-xs text-gray-600">Passphrase</span>
             </label>
             <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                    type="radio"
                    name={`${prefix}-keyType`}
                    value="Utf8"
                    checked={state.keyType === "Utf8"}
                    onChange={() => updateState("keyType", "Utf8")}
                    className="w-3.5 h-3.5 text-blue-600"
                />
                <span className="text-xs text-gray-600">Raw Text (UTF-8)</span>
             </label>
        </div>
      </div>
    </div>
  );
};
