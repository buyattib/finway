import { data } from 'react-router'

import type { Route } from './+types/movement'

import { dbContext, userContext } from '~/lib/context'

import { deleteTransactionAction } from '~/routes/transactions/lib/services'
import { deleteTransferAction } from '~/routes/transfers/lib/services'
import { deleteExchangeAction } from '~/routes/exchanges/lib/services'

import {
	MOVEMENT_TAB_TRANSACTIONS,
	MOVEMENT_TAB_TRANSFERS,
	MOVEMENT_TAB_EXCHANGES,
} from './lib/constants'
import { assertMovementTab, assertNever } from './lib/utils'

export async function action({ request, context, params }: Route.ActionArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	assertMovementTab(params.movement)
	const { movement, movementId } = params

	const formData = await request.formData()
	const intent = formData.get('intent')
	if (intent !== 'delete') {
		throw data('Method not allowed', { status: 405 })
	}

	const base = { db, user, request, context }

	if (movement === MOVEMENT_TAB_TRANSACTIONS) {
		return await deleteTransactionAction({
			...base,
			transactionId: movementId,
		})
	}

	if (movement === MOVEMENT_TAB_TRANSFERS) {
		return await deleteTransferAction({ ...base, transferId: movementId })
	}

	if (movement === MOVEMENT_TAB_EXCHANGES) {
		return await deleteExchangeAction({ ...base, exchangeId: movementId })
	}

	assertNever(movement)
}
