import { initReactI18next } from 'react-i18next'
import { createCookie } from 'react-router'
import { createI18nextMiddleware } from 'remix-i18next/middleware'

import { env } from '~/utils-server/env.server'
import { STAGE_PRODUCTION } from '~/lib/constants'
import resources from '~/locales'
import 'i18next'

// This cookie will be used to store the user locale preference
export const localeCookie = createCookie('lng', {
	path: '/',
	sameSite: 'lax',
	secure: env.NODE_ENV === STAGE_PRODUCTION,
	httpOnly: true,
})

export const [i18nextMiddleware, getLocale, getInstance] =
	createI18nextMiddleware({
		detection: {
			supportedLanguages: ['es', 'en'], // Your supported languages, the fallback should be last
			fallbackLanguage: 'en', // Your fallback language
			cookie: localeCookie, // The cookie to store the user preference
		},
		i18next: { resources }, // Your locales
		plugins: [initReactI18next], // Plugins you may need, like react-i18next
	})

export async function getLocaleHeaders(locale: string) {
	return { 'Set-Cookie': await localeCookie.serialize(locale) }
}

// This adds type-safety to the `t` function
declare module 'i18next' {
	interface CustomTypeOptions {
		defaultNS: false
		resources: typeof resources.en // Use `en` as source of truth for the types
	}
}
