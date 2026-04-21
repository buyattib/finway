import { data } from 'react-router'

import type { Route } from './+types/movement'

import { createToastHeaders } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { getBalances } from '~/lib/queries'

import {
	getTransactionById,
	deleteTransaction,
} from '~/routes/transactions/lib/queries'
import {
	getTransferById,
	getTransferBalance,
	deleteTransfer,
} from '~/routes/transfers/lib/queries'
import {
	getExchangeById,
	getExchangeBalance,
	deleteExchange,
} from '~/routes/exchanges/lib/queries'

import {
	MOVEMENT_TABS,
	MOVEMENT_TAB_TRANSACTIONS,
	MOVEMENT_TAB_TRANSFERS,
	MOVEMENT_TAB_EXCHANGES,
} from './lib/constants'
import type { TMovementTab } from './lib/types'

export async function action({ request, context, params }: Route.ActionArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const { movement, movementId } = params
	if (!MOVEMENT_TABS.includes(movement as TMovementTab)) {
		throw data('Not found', { status: 404 })
	}

	const formData = await request.formData()
	const intent = formData.get('intent')
	if (intent !== 'delete') {
		throw data('Method not allowed', { status: 405 })
	}

	if (movement === MOVEMENT_TAB_TRANSACTIONS) {
		const t = getServerT(context, 'transactions')

		const transaction = await getTransactionById({
			db,
			transactionId: movementId,
		})
		if (!transaction || transaction.account.ownerId !== user.id) {
			const toastHeaders = await createToastHeaders(request, {
				type: 'error',
				title: t('index.action.notFoundError', {
					transactionId: movementId,
				}),
			})
			return data({}, { headers: toastHeaders, status: 404 })
		}

		const [{ balance }] = await getBalances({
			db,
			ownerId: user.id,
			accountId: transaction.accountId,
			currencyId: transaction.currencyId,
			parseBalance: false,
		})
		if (balance < transaction.amount) {
			const toastHeaders = await createToastHeaders(request, {
				type: 'error',
				title: t('index.action.negativeBalanceError'),
			})
			return data({}, { headers: toastHeaders })
		}

		await deleteTransaction({ db, transactionId: movementId })

		const toastHeaders = await createToastHeaders(request, {
			type: 'success',
			title: t('index.action.successToast'),
		})
		return data({}, { headers: toastHeaders })
	}

	if (movement === MOVEMENT_TAB_TRANSFERS) {
		const t = getServerT(context, 'transfers')

		const transfer = await getTransferById({ db, transferId: movementId })
		if (
			!transfer ||
			(transfer.fromAccount &&
				transfer.fromAccount.ownerId !== user.id) ||
			(transfer.toAccount && transfer.toAccount.ownerId !== user.id)
		) {
			const toastHeaders = await createToastHeaders(request, {
				type: 'error',
				title: t('index.action.notFoundError', {
					transferId: movementId,
				}),
			})
			return data({}, { headers: toastHeaders, status: 404 })
		}

		const balance = await getTransferBalance({
			db,
			ownerId: user.id,
			accountId: transfer.toAccountId,
			currencyId: transfer.currencyId,
		})
		if (!balance || balance.balance < transfer.amount) {
			const toastHeaders = await createToastHeaders(request, {
				type: 'error',
				title: t('index.action.negativeBalanceError'),
			})
			return data({}, { headers: toastHeaders })
		}

		await deleteTransfer({ db, transferId: movementId })

		const toastHeaders = await createToastHeaders(request, {
			type: 'success',
			title: t('index.action.successToast'),
		})
		return data({}, { headers: toastHeaders })
	}

	if (movement === MOVEMENT_TAB_EXCHANGES) {
		const t = getServerT(context, 'exchanges')

		const exchange = await getExchangeById({ db, exchangeId: movementId })
		if (!exchange || exchange.account.ownerId !== user.id) {
			const toastHeaders = await createToastHeaders(request, {
				type: 'error',
				title: t('index.action.notFoundError', {
					exchangeId: movementId,
				}),
			})
			return data({}, { headers: toastHeaders, status: 404 })
		}

		const balance = await getExchangeBalance({
			db,
			ownerId: user.id,
			accountId: exchange.accountId,
			currencyId: exchange.toCurrencyId,
		})
		if (!balance || balance.balance < exchange.toAmount) {
			const toastHeaders = await createToastHeaders(request, {
				type: 'error',
				title: t('index.action.negativeBalanceError'),
			})
			return data({}, { headers: toastHeaders })
		}

		await deleteExchange({ db, exchangeId: movementId })

		const toastHeaders = await createToastHeaders(request, {
			type: 'success',
			title: t('index.action.successToast'),
		})
		return data({}, { headers: toastHeaders })
	}

	throw data('Not found', { status: 404 })
}
