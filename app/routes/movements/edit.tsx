import type { Route } from './+types/edit'

import { dbContext, userContext } from '~/lib/context'
import { ACTION_EDITION } from '~/lib/constants'

import { getTransactionById } from '~/routes/transactions/lib/queries'
import { editTransactionAction } from '~/routes/transactions/lib/services'
import { getTransferById } from '~/routes/transfers/lib/queries'
import { editTransferAction } from '~/routes/transfers/lib/services'
import { getExchangeById } from '~/routes/exchanges/lib/queries'
import { editExchangeAction } from '~/routes/exchanges/lib/services'

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
	const movement = params.movement

	const formData = await getMovementFormData({ db, ownerId: user.id })

	if (movement === MOVEMENT_TAB_TRANSACTIONS) {
		const transaction = await getTransactionById({
			db,
			transactionId: params.movementId,
		})
		if (!transaction || transaction.account.ownerId !== user.id) {
			throw new Response('Not Found', { status: 404 })
		}

		const { account: _account, ...transactionData } = transaction

		return {
			movement,
			formData,
			transaction: {
				...transactionData,
				amount: String(transactionData.amount / 100),
			},
		}
	}

	if (movement === MOVEMENT_TAB_TRANSFERS) {
		const transfer = await getTransferById({
			db,
			transferId: params.movementId,
		})
		if (
			!transfer ||
			transfer.fromAccount.ownerId !== user.id ||
			transfer.toAccount.ownerId !== user.id
		) {
			throw new Response('Not Found', { status: 404 })
		}

		const {
			fromAccount: _fromAccount,
			toAccount: _toAccount,
			...transferData
		} = transfer

		return {
			movement,
			formData,
			transfer: {
				...transferData,
				amount: String(transferData.amount / 100),
			},
		}
	}

	if (movement === MOVEMENT_TAB_EXCHANGES) {
		const exchange = await getExchangeById({
			db,
			exchangeId: params.movementId,
		})
		if (!exchange || exchange.account.ownerId !== user.id) {
			throw new Response('Not Found', { status: 404 })
		}

		const { account: _account, ...exchangeData } = exchange

		return {
			movement,
			formData,
			exchange: {
				...exchangeData,
				fromAmount: String(exchangeData.fromAmount / 100),
				toAmount: String(exchangeData.toAmount / 100),
			},
		}
	}

	assertNever(movement)
}

export async function action({ request, context, params }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	assertMovementTab(params.movement)

	const formData = await request.formData()
	const args = { db, user, request, context, formData }

	switch (params.movement) {
		case MOVEMENT_TAB_TRANSACTIONS:
			return await editTransactionAction(args)
		case MOVEMENT_TAB_TRANSFERS:
			return await editTransferAction(args)
		case MOVEMENT_TAB_EXCHANGES:
			return await editExchangeAction(args)
		default:
			assertNever(params.movement)
	}
}

export default function MovementEdit({ loaderData }: Route.ComponentProps) {
	const { formData, ...data } = loaderData

	if (data.movement === MOVEMENT_TAB_TRANSACTIONS) {
		return (
			<MovementFormDialog
				action={ACTION_EDITION}
				entity={data.movement}
				transaction={data.transaction}
				{...formData}
			/>
		)
	}

	if (data.movement === MOVEMENT_TAB_TRANSFERS) {
		return (
			<MovementFormDialog
				action={ACTION_EDITION}
				entity={data.movement}
				transfer={data.transfer}
				{...formData}
			/>
		)
	}

	if (data.movement === MOVEMENT_TAB_EXCHANGES) {
		return (
			<MovementFormDialog
				action={ACTION_EDITION}
				entity={data.movement}
				exchange={data.exchange}
				{...formData}
			/>
		)
	}

	return null
}
