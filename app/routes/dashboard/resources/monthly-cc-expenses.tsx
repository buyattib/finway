import type { Route } from './+types/monthly-cc-expenses'

import { dbContext, userContext } from '~/lib/context'

import {
	getCreditCardExpenseCurrencies,
	getMonthlyCreditCardExpenses,
} from '../lib/queries'

export async function loader({ context, request }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const url = new URL(request.url)
	const searchParams = url.searchParams

	const currencyId = searchParams.get('currencyId')
	const from = searchParams.get('from')
	const to = searchParams.get('to')

	if (!currencyId) {
		throw new Response('currencyId is required', { status: 400 })
	}

	const [currencies, data] = await Promise.all([
		getCreditCardExpenseCurrencies({
			db,
			ownerId: user.id,
			from,
			to,
		}),
		getMonthlyCreditCardExpenses({
			db,
			ownerId: user.id,
			currencyId,
			from,
			to,
		}),
	])

	return { currencies, data }
}
