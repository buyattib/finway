import { redirect } from 'react-router'
import { safeRedirect } from 'remix-utils/safe-redirect'

import type { Route } from './+types/authenticate'

import { database } from '~/database/context'
import {
	createAuthSessionHeaders,
	removeAuthSession,
	requireAnonymous,
} from '~/utils/auth.server'
import { createToastHeaders } from '~/utils/toast.server'
import { combineHeaders } from '~/utils/headers.server'

export async function loader({ request, params: { token } }: Route.LoaderArgs) {
	await requireAnonymous(request)

	const db = database()

	// TODO: for now the token is the userId, need to hash it later
	const user = await db.query.users.findFirst({
		columns: { id: true, email: true },
		where: (users, { eq }) => eq(users.id, token),
	})

	if (!user) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: 'Error logging in',
			description:
				'There was an error with your login, please try again.',
		})
		const authHeaders = await removeAuthSession(request)

		return redirect('/login', {
			headers: combineHeaders(authHeaders, toastHeaders),
		})
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
	return redirect(safeRedirect(redirectTo), {
		headers: combineHeaders(authHeaders, toastHeaders),
	})
}
