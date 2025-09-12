import { createCookieSessionStorage } from 'react-router'
import { database } from '~/database/context'
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
	cookie: string | null,
	userId: string,
	remember?: boolean,
) {
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

export async function removeAuthSession(cookie: string | null) {
	const authSession = await authSessionStorage.getSession(cookie)
	const authCookie = await authSessionStorage.destroySession(authSession)
	return new Headers({ 'Set-Cookie': authCookie })
}

export async function getCurrentUser(cookie: string | null) {
	const db = database()

	const authSession = await authSessionStorage.getSession(cookie)
	const userId = authSession.get('userId') as string | undefined

	if (!userId) return undefined

	const user = await db.query.users.findFirst({
		columns: {
			id: true,
			email: true,
		},
		where: (users, { eq }) => eq(users.id, userId),
	})
	return user
}
