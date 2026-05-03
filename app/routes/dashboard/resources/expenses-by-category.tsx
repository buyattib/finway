import type { Route } from './+types/expenses-by-category'

import { dbContext, userContext } from '~/lib/context'
import { TRANSACTION_TYPE_EXPENSE } from '~/features/transactions/constants'

import {
	getMonthTransactionCurrencies,
	getMonthTransactionsByCategory,
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

	const [currencies, transactionsByCategory] = await Promise.all([
		getMonthTransactionCurrencies({
			db,
			ownerId: user.id,
			transactionType: TRANSACTION_TYPE_EXPENSE,
			from,
			to,
		}),
		getMonthTransactionsByCategory({
			db,
			ownerId: user.id,
			transactionType: TRANSACTION_TYPE_EXPENSE,
			currencyId,
			from,
			to,
		}),
	])

	return { currencies, data: transactionsByCategory }
}
