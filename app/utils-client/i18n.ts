import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector'
import resources from '~/locales'

export async function createI18nInstance(locale?: string) {
	return await i18next
		.use(initReactI18next)
		.use(I18nextBrowserLanguageDetector)
		.init({
			lng: locale,
			fallbackLng: 'en', // Change this to your default language
			// Here we only want to detect the language from the html tag
			// since the middleware already detected the language server-side
			detection: { order: ['htmlTag'], caches: [] },
			resources,
		})
}
