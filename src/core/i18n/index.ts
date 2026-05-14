import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './en.json';
const locale = getLocales()[0]?.languageCode ?? 'en';
i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: locale.startsWith('en') ? 'en' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
export default i18n;
