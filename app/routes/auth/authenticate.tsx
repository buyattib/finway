import { safeRedirect } from 'remix-utils/safe-redirect'

import type { Route } from './+types/authenticate'

import { dbContext } from '~/lib/context'
import { getUserByEmail, createUser } from '~/lib/queries'
import {
	createAuthSessionHeaders,
	removeAuthSession,
	requireAnonymous,
} from '~/utils-server/auth.server'
import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { validateMagicLink } from './server/magic-link.server'

export async function loader({ request, context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const t = getServerT(context, 'auth')

	await requireAnonymous(request, db)

	let email
	try {
		email = await validateMagicLink(request.url, t)
	} catch (err) {
		const authHeaders = await removeAuthSession(request)
		return await redirectWithToast(
			'/login',
			request,
			{
				type: 'error',
				title: t('authenticate.action.errorToast'),
				description: String(err),
			},
			{ headers: authHeaders },
		)
	}

	let user = await getUserByEmail({ db, email })

	if (!user) {
		user = await createUser({ db, email })
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
			title: t('authenticate.action.successToast'),
			description: t('authenticate.action.successDescription'),
		},
		{ headers: authHeaders },
	)
}
