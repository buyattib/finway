import type { Route } from './+types/monthly-cc-expenses'

import { dbContext, userContext } from '~/lib/context'

import { getMonthlyCreditCardExpenses } from '../lib/queries'

export async function loader({ context, request }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const url = new URL(request.url)
	const currencyId = url.searchParams.get('currencyId')

	if (!currencyId) {
		throw new Response('currencyId is required', { status: 400 })
	}

	return await getMonthlyCreditCardExpenses({
		db,
		ownerId: user.id,
		currencyId,
	})
}
