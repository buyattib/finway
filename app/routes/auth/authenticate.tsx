import { safeRedirect } from 'remix-utils/safe-redirect'

import type { Route } from './+types/authenticate'

import { user as userTable } from '~/database/schema'
import { dbContext } from '~/lib/context'
import {
	createAuthSessionHeaders,
	removeAuthSession,
	requireAnonymous,
} from '~/utils-server/auth.server'
import { redirectWithToast } from '~/utils-server/toast.server'

import { validateMagicLink } from './lib/magic-link.server'

export async function loader({ request, context }: Route.LoaderArgs) {
	const db = context.get(dbContext)

	await requireAnonymous(request, db)

	let email
	try {
		email = await validateMagicLink(request.url)
	} catch (err) {
		const authHeaders = await removeAuthSession(request)
		return await redirectWithToast(
			'/login',
			request,
			{
				type: 'error',
				title: 'Error logging in',
				description: String(err),
			},
			{ headers: authHeaders },
		)
	}

	let user = await db.query.user.findFirst({
		columns: { id: true, email: true },
		where: (user, { eq }) => eq(user.email, email),
	})

	if (!user) {
		const result = await db
			.insert(userTable)
			.values({ email })
			.returning({ id: userTable.id, email: userTable.email })

		user = result[0]
	}

	const searchParams = new URL(request.url).searchParams
	const remember = searchParams.get('remember') === 'true'
	const redirectTo = searchParams.get('redirectTo')

	const authHeaders = await createAuthSessionHeaders(
		request,
		user.id,
		remember,
	)

	return await redirectWithToast(
		safeRedirect(redirectTo ?? '/app'),
		request,
		{
			type: 'success',
			title: 'Logged in!',
			description: 'You were successfully logged in',
		},
		{ headers: authHeaders },
	)
}
