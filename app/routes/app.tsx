import { redirect } from 'react-router'

import { dbContext } from '~/lib/context'
import { requireAuthenticated } from '~/utils-server/auth.server'

import type { Route } from './+types/app'

export async function loader({ request, context }: Route.LoaderArgs) {
	await requireAuthenticated(request, context.get(dbContext), {
		redirectTo: null,
	})
	return redirect('/app/dashboard')
}
