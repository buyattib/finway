import type { Route } from './+types/edit'

import { dbContext, userContext } from '~/lib/context'
import { ACTION_EDITION } from '~/lib/constants'

import { getTransactionById } from '~/routes/transactions/lib/queries'
import { getTransferById } from '~/routes/transfers/lib/queries'
import { getExchangeById } from '~/routes/exchanges/lib/queries'

import {
	MOVEMENT_TAB_TRANSACTIONS,
	MOVEMENT_TAB_TRANSFERS,
	MOVEMENT_TAB_EXCHANGES,
	MOVEMENT_TABS,
} from './lib/constants'
import { getMovementFormData } from './lib/services'
import { MovementFormDialog } from './components/movement-form/dialog'

export async function loader({ context, params }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const movement = MOVEMENT_TABS.find(t => t === params.movement)
	if (!movement) {
		throw new Response('Not Found', { status: 404 })
	}

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

	throw new Response('Invalid movement')
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
