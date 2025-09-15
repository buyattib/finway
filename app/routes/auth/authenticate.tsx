import { redirect } from 'react-router'
import { safeRedirect } from 'remix-utils/safe-redirect'

import type { Route } from './+types/authenticate'

import * as schema from '~/database/schema'
import { dbContext } from '~/lib/context'
import {
	createAuthSessionHeaders,
	removeAuthSession,
	requireAnonymous,
} from '~/utils/auth.server'
import { createToastHeaders } from '~/utils/toast.server'
import { combineHeaders } from '~/utils/headers.server'
import { validateMagicLink } from '~/utils/magic-link.server'

export async function loader({ request, context }: Route.LoaderArgs) {
	const db = context.get(dbContext)

	await requireAnonymous(request, db)

	let email
	try {
		email = await validateMagicLink(request.url)
	} catch (err) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: 'Error logging in',
			description: String(err),
		})
		const authHeaders = await removeAuthSession(request)
		return redirect('/login', {
			headers: combineHeaders(authHeaders, toastHeaders),
		})
	}

	let user = await db.query.users.findFirst({
		columns: { id: true, email: true },
		where: (users, { eq }) => eq(users.email, email),
	})

	if (!user) {
		const result = await db
			.insert(schema.users)
			.values({ email })
			.returning({ id: schema.users.id, email: schema.users.email })

		user = result[0]
	}

	const searchParams = new URL(request.url).searchParams
	const remember = searchParams.get('remember') === 'true'
	const redirectTo = searchParams.get('redirectTo')

	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: 'Logged in!',
		description: 'You were successfully logged in',
	})
	const authHeaders = await createAuthSessionHeaders(
		request,
		user.id,
		remember,
	)
	return redirect(safeRedirect(redirectTo ?? '/app'), {
		headers: combineHeaders(authHeaders, toastHeaders),
	})
}
