import i18next from 'i18next'
import { startTransition, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { HydratedRouter } from 'react-router/dom'
import { createI18nInstance } from './utils-client/i18n'

async function main() {
	await createI18nInstance()

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
