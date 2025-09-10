// NOTE: this is used for public forms that perform mutations, no needed behind auth
import { CSRF } from 'remix-utils/csrf/server'
import { createCookie } from 'react-router'

import { env } from './env.server'

export const cookie = createCookie('csrf', {
	path: '/',
	httpOnly: true,
	secure: env.NODE_ENV === 'production',
	sameSite: 'lax',
	secrets: env.SESSION_SECRET.split(','),
})

export const csrf = new CSRF({
	cookie,
	// what key in FormData objects will be used for the token, defaults to `csrf`
	formDataKey: 'csrf',
	// an optional secret used to sign the token, recommended for extra safety
	secret: env.SESSION_SECRET,
})
