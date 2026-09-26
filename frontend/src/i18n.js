import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources, SUPPORTED_LANGUAGES } from './locales/index.js';

export { SUPPORTED_LANGUAGES };

const savedLang = localStorage.getItem('feedguard_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('feedguard_language', lng);
    document.documentElement.lang = lng;
    const title = i18n.t('brand.name', 'FEED GUARD');
    const sub = i18n.t('brand.subtitle', 'AI-Powered Feed & Silage Quality Testing for Dairy Farmers');
    document.title = `${title} — ${sub}`;
  } catch (e) {
    console.error('Failed to sync languageChanged:', e);
  }
});

// Set initial document title and language attribute
try {
  document.documentElement.lang = savedLang;
  const title = i18n.t('brand.name', 'FEED GUARD');
  const sub = i18n.t('brand.subtitle', 'AI-Powered Feed & Silage Quality Testing for Dairy Farmers');
  document.title = `${title} — ${sub}`;
} catch (e) {}

export default i18n;
