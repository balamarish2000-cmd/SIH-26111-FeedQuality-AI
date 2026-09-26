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

function applyDirection(lng) {
  const isRTL = lng === 'ur';
  try {
    document.documentElement.lang = lng;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    if (document.body) {
      if (isRTL) {
        document.body.classList.add('rtl');
      } else {
        document.body.classList.remove('rtl');
      }
    }
  } catch (e) {
    console.error('Failed to apply direction:', e);
  }
}

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('feedguard_language', lng);
    applyDirection(lng);
    const title = i18n.t('brand.name', 'FEED GUARD');
    const sub = i18n.t('brand.subtitle', 'AI-Powered Feed & Silage Quality Testing for Dairy Farmers');
    document.title = `${title} — ${sub}`;
  } catch (e) {
    console.error('Failed to sync languageChanged:', e);
  }
});

// Set initial document title and language attribute
try {
  applyDirection(savedLang);
  const title = i18n.t('brand.name', 'FEED GUARD');
  const sub = i18n.t('brand.subtitle', 'AI-Powered Feed & Silage Quality Testing for Dairy Farmers');
  document.title = `${title} — ${sub}`;
} catch (e) {}

export default i18n;

