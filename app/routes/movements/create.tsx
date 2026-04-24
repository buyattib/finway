import type { Route } from './+types/create'

import { dbContext, userContext } from '~/lib/context'
import { ACTION_CREATION } from '~/lib/constants'

import { createTransactionAction } from '~/features/transactions/services'
import { createTransferAction } from '~/routes/transfers/lib/services'
import { createExchangeAction } from '~/routes/exchanges/lib/services'

import {
	MOVEMENT_TAB_TRANSACTIONS,
	MOVEMENT_TAB_TRANSFERS,
	MOVEMENT_TAB_EXCHANGES,
} from './lib/constants'
import { getMovementFormData } from './lib/queries'
import { assertMovementTab, assertNever } from './lib/utils'
import { MovementFormDialog } from './components/movement-form/dialog'

export async function loader({ context, params }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	assertMovementTab(params.movement)

	const formData = await getMovementFormData({ db, ownerId: user.id })
	return { movement: params.movement, formData }
}

export async function action({ request, context, params }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	assertMovementTab(params.movement)

	const formData = await request.formData()
	const args = { db, user, request, context, formData }

	if (params.movement === MOVEMENT_TAB_TRANSACTIONS) {
		return await createTransactionAction(args)
	}

	if (params.movement === MOVEMENT_TAB_TRANSFERS) {
		return await createTransferAction(args)
	}

	if (params.movement === MOVEMENT_TAB_EXCHANGES) {
		return await createExchangeAction(args)
	}

	assertNever(params.movement)
}

export default function MovementCreate({
	loaderData: { movement, formData },
}: Route.ComponentProps) {
	return (
		<MovementFormDialog
			action={ACTION_CREATION}
			entity={movement}
			{...formData}
		/>
	)
}
