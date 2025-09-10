import { createCookieSessionStorage } from 'react-router'
import { env } from './env.server'

export const toastSessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'toast',
		sameSite: 'lax',
		path: '/',
		secure: env.NODE_ENV === 'production',
		httpOnly: true,
		secrets: env.SESSION_SECRET.split(','),
	},
})
