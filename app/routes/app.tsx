import { data, redirect } from 'react-router'

import { dbContext } from '~/lib/context'
import { requireAuthenticated } from '~/utils-server/auth.server'
import { themeAction } from '~/utils-server/theme.server'
import { localeAction } from '~/utils-server/i18n.server'

import type { Route } from './+types/app'

export async function loader({ request, context }: Route.LoaderArgs) {
	await requireAuthenticated(request, context.get(dbContext), {
		redirectTo: null,
	})
	return redirect('/app')
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()

	if (formData.get('intent') === 'theme-toggle') {
		return await themeAction(formData)
	}

	if (formData.get('intent') === 'locale-toggle') {
		return await localeAction(formData)
	}

	return data({ status: 'error', submission: undefined }, { status: 400 })
}
