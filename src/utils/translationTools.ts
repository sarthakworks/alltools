
import fs from 'fs';
import path from 'path';

export const languages = {
  en: 'English',
  hi: 'Hindi',
  de: 'German',
  fr: 'French',
  it: 'Italian',
  ar: 'Arabic',
};

const defaultLang = 'en';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in languages) return lang as keyof typeof languages;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof languages) {
  const filePath = path.join(process.cwd(), 'src', 'locales', lang, 'translation.json');
  let translations: any = {};
  
  try {
      if (fs.existsSync(filePath)) {
          translations = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
  } catch (e) {
      console.error(`Failed to load translations for ${lang}`, e);
  }

  return function t(key: string, options?: any) {
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    
    // Fallback to English if missing
    if (!value && lang !== 'en') {
       if (!(globalThis as any).enTranslations) {
           try {
             const enPath = path.join(process.cwd(), 'src', 'locales', 'en', 'translation.json');
             if (fs.existsSync(enPath)) {
                (globalThis as any).enTranslations = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
             }
           } catch(e) {
             // ignore
           }
       }
       let enValue = (globalThis as any).enTranslations;
       if (enValue) {
           for (const k of keys) {
               enValue = enValue?.[k];
           }
           value = enValue;
       }
    }

    if (!value) return options?.defaultValue || key;
    return value;
  }
}

// Global cache for fallback
declare global {
    var enTranslations: any;
}
