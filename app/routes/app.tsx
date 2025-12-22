import { data, redirect } from 'react-router'

import { dbContext } from '~/lib/context'
import { requireAuthenticated } from '~/utils-server/auth.server'
import { themeAction } from '~/utils-server/theme.server'

import type { Route } from './+types/app'

export async function loader({ request, context }: Route.LoaderArgs) {
	requireAuthenticated(request, context.get(dbContext), { redirectTo: null })
	return redirect('/app')
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()

	if (formData.get('intent') === 'theme-toggle') {
		return await themeAction(formData)
	}

	return data({ status: 'error', submission: undefined }, { status: 400 })
}
