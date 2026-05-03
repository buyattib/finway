import type { Route } from './+types/expenses-by-category'

import { dbContext, userContext } from '~/lib/context'
import { TRANSACTION_TYPE_EXPENSE } from '~/features/transactions/constants'

import { getMonthTransactionsByCategory } from '../lib/queries'

export async function loader({ context, request }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const url = new URL(request.url)
	const currencyId = url.searchParams.get('currencyId')

	if (!currencyId) {
		throw new Response('currencyId is required', { status: 400 })
	}

	return await getMonthTransactionsByCategory({
		db,
		ownerId: user.id,
		transactionType: TRANSACTION_TYPE_EXPENSE,
		currencyId,
	})
}
