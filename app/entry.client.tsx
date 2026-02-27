import i18next from 'i18next'
import { startTransition, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { HydratedRouter } from 'react-router/dom'
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector'
import resources from '~/locales'

async function main() {
	await i18next
		.use(initReactI18next)
		.use(I18nextBrowserLanguageDetector)
		.init({
			fallbackLng: 'en', // Change this to your default language
			// Here we only want to detect the language from the html tag
			// since the middleware already detected the language server-side
			detection: { order: ['htmlTag'], caches: [] },
			resources,
		})

	startTransition(() => {
		hydrateRoot(
			document,
			<I18nextProvider i18n={i18next}>
				<StrictMode>
					<HydratedRouter />
				</StrictMode>
			</I18nextProvider>,
		)
	})
}

main().catch(error => console.error(error))
