import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import fr from './fr.json'

const saved = localStorage.getItem('dentcare_lang')

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr } },
  lng: saved === 'fr' ? 'fr' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('dentcare_lang', lng)
  document.documentElement.lang = lng
})
document.documentElement.lang = i18n.language

export default i18n
