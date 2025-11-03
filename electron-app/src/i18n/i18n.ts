import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../../dictionary/en.json';
import ar from '../../dictionary/ar.json';
import fr from '../../dictionary/fr.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    fr: { translation: fr },
  },
  lng: 'ar',
  fallbackLng: 'ar',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

