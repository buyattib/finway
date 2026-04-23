import type { Route } from './+types/edit'

import { dbContext, userContext } from '~/lib/context'
import { ACTION_EDITION } from '~/lib/constants'

import { getTransactionById } from '~/routes/transactions/lib/queries'

import { MOVEMENT_TAB_TRANSACTIONS } from './lib/constants'
import { getMovementFormData } from './lib/services'
import { MovementFormDialog } from './components/movement-form/dialog'

export async function loader({
	context,
	params: { movement, movementId },
}: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	if (movement !== MOVEMENT_TAB_TRANSACTIONS) {
		throw new Response('Not Found', { status: 404 })
	}

	const transaction = await getTransactionById({
		db,
		transactionId: movementId,
	})
	if (!transaction || transaction.account.ownerId !== user.id) {
		throw new Response('Not Found', { status: 404 })
	}

	const { account: _account, ...transactionData } = transaction

	const formData = await getMovementFormData({ db, ownerId: user.id })

	return {
		movement,
		formData,
		transaction: {
			...transactionData,
			amount: String(transactionData.amount / 100),
		},
	}
}

export default function MovementEdit({
	loaderData: { movement, formData, transaction },
}: Route.ComponentProps) {
	return (
		<MovementFormDialog
			action={ACTION_EDITION}
			entity={movement as typeof MOVEMENT_TAB_TRANSACTIONS}
			transaction={transaction}
			{...formData}
		/>
	)
}
