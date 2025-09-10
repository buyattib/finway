import { createCookieSessionStorage, redirect } from 'react-router'

import { type ToastSession, ToastSessionSchema } from '~/components/show-toast'
import { env } from './env.server'
import { combineHeaders } from './headers.server'

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

export async function createToastHeaders(
	cookie: string | null,
	toast: ToastSession,
) {
	const toastCookieSession = await toastSessionStorage.getSession(cookie)
	const data = ToastSessionSchema.parse(toast)
	toastCookieSession.flash('toast', data)
	const toastCookie =
		await toastSessionStorage.commitSession(toastCookieSession)

	return new Headers({ 'Set-Cookie': toastCookie })
}

export async function getToast(cookie: string | null) {
	const toastCookieSession = await toastSessionStorage.getSession(cookie)
	const toastData = toastCookieSession.get('toast')

	const result = ToastSessionSchema.safeParse(toastData)

	const toast = result.success ? result.data : null
	const headers = toast
		? new Headers({
				'set-cookie':
					await toastSessionStorage.destroySession(
						toastCookieSession,
					),
			})
		: null

	return { toast, headers }
}

export async function redirectWithToast(
	url: string,
	cookie: string | null,
	toast: ToastSession,
	init?: ResponseInit,
) {
	return redirect(url, {
		...init,
		headers: combineHeaders(
			init?.headers,
			await createToastHeaders(cookie, toast),
		),
	})
}
