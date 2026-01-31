import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import hi from './locales/hi/translation.json';
import de from './locales/de/translation.json';
import fr from './locales/fr/translation.json';
import it from './locales/it/translation.json';
import ar from './locales/ar/translation.json';

// Translation resources
const resources = {
  en: { translation: en },
  hi: { translation: hi },
  de: { translation: de },
  fr: { translation: fr },
  it: { translation: it },
  ar: { translation: ar }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
