import type { Route } from './+types/edit'

import { dbContext, userContext } from '~/lib/context'
import { ACTION_EDITION } from '~/lib/constants'

import { getTransactionById } from '~/routes/transactions/lib/queries'

import { MOVEMENT_TAB_TRANSACTIONS, MOVEMENT_TABS } from './lib/constants'
import { getMovementFormData } from './lib/services'
import { MovementFormDialog } from './components/movement-form/dialog'

export async function loader({ context, params }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const movement = MOVEMENT_TABS.find(t => t === params.movement)
	if (!movement || movement !== MOVEMENT_TAB_TRANSACTIONS) {
		throw new Response('Not Found', { status: 404 })
	}

	const transaction = await getTransactionById({
		db,
		transactionId: params.movementId,
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
			entity={movement}
			transaction={transaction}
			{...formData}
		/>
	)
}
