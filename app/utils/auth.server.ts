import { createCookieSessionStorage, redirect } from 'react-router'
import type { DB } from '~/lib/types'
import { env } from './env.server'

export const authSessionStorage = createCookieSessionStorage({
	cookie: {
		name: 'finhub_session',
		sameSite: 'lax',
		path: '/',
		secure: env.NODE_ENV === 'production',
		httpOnly: true,
		secrets: env.SESSION_SECRET.split(','),
	},
})

export async function createAuthSessionHeaders(
	request: Request,
	userId: string,
	remember?: boolean,
) {
	const cookie = request.headers.get('Cookie')
	const authSession = await authSessionStorage.getSession(cookie)
	authSession.set('userId', userId)

	let expires: Date | undefined
	if (remember) {
		expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
	}

	const authCookie = await authSessionStorage.commitSession(authSession, {
		expires,
	})

	return new Headers({ 'Set-Cookie': authCookie })
}

export async function removeAuthSession(request: Request) {
	const cookie = request.headers.get('Cookie')
	const authSession = await authSessionStorage.getSession(cookie)
	const authCookie = await authSessionStorage.destroySession(authSession)
	return new Headers({ 'Set-Cookie': authCookie })
}

export async function getCurrentUser(request: Request, db: DB) {
	const cookie = request.headers.get('Cookie')

	const authSession = await authSessionStorage.getSession(cookie)
	const userId = authSession.get('userId') as string | undefined

	if (!userId) return null

	const user = await db.query.users.findFirst({
		columns: {
			id: true,
			email: true,
		},
		where: (users, { eq }) => eq(users.id, userId),
	})
	return user ?? null
}

export async function requireAnonymous(request: Request, db: DB) {
	const user = await getCurrentUser(request, db)

	if (user) throw redirect('/app')
}

export async function requireAuthenticated(
	request: Request,
	db: DB,
	{ redirectTo: _redirectTo }: { redirectTo?: string | null } = {},
) {
	const user = await getCurrentUser(request, db)

	if (!user) {
		const authHeaders = await removeAuthSession(request)

		const requestUrl = new URL(request.url)
		// If null we dont want to specify a redirectTo, if undefined we set it to current url otherwise we set it to what is coming
		const redirectTo =
			_redirectTo === null
				? null
				: (_redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`)
		const loginParams = redirectTo
			? new URLSearchParams({ redirectTo })
			: null
		const loginRedirect = ['/login', loginParams?.toString()]
			.filter(Boolean)
			.join('?')

		throw redirect(loginRedirect, { headers: authHeaders })
	}

	return user
}
