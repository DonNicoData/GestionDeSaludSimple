import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import es from './es.json'
import en from './en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Solo localStorage: en la primera visita no hay nada guardado,
      // entonces i18next cae al fallbackLng ('es'). El navegador del usuario
      // no debe forzar otro idioma. El usuario elige con el toggle ES/EN.
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'salud_lang',
    },
  })

export default i18n
