import { createCookieSessionStorage, redirect } from 'react-router'

import { type ToastSession, ToastSessionSchema } from '~/components/show-toast'
import { env } from './env.server'
import { combineHeaders } from './headers.server'

const toastCookieKey = 'finway_toast'

export const toastSessionStorage = createCookieSessionStorage({
	cookie: {
		name: toastCookieKey,
		sameSite: 'lax',
		path: '/',
		secure: env.NODE_ENV === 'production',
		httpOnly: true,
		secrets: env.SESSION_SECRET.split(','),
	},
})

export async function createToastHeaders(
	request: Request,
	toast: ToastSession,
) {
	const cookie = request.headers.get('Cookie')
	const toastCookieSession = await toastSessionStorage.getSession(cookie)
	const data = ToastSessionSchema.parse(toast)
	toastCookieSession.flash(toastCookieKey, data)
	const toastCookie =
		await toastSessionStorage.commitSession(toastCookieSession)

	return new Headers({ 'Set-Cookie': toastCookie })
}

export async function getToast(request: Request) {
	const cookie = request.headers.get('Cookie')
	const toastCookieSession = await toastSessionStorage.getSession(cookie)
	const toastData = toastCookieSession.get(toastCookieKey)

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
	request: Request,
	toast: ToastSession,
	init?: ResponseInit,
) {
	return redirect(url, {
		...init,
		headers: combineHeaders(
			init?.headers,
			await createToastHeaders(request, toast),
		),
	})
}
