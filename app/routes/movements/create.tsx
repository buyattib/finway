import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types/create'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import { getCurrencyById } from '~/lib/queries'
import { ACTION_CREATION } from '~/lib/constants'

import { getAccountById } from '~/routes/accounts/lib/queries'
import { TRANSACTION_TYPE_EXPENSE } from '~/routes/transactions/lib/constants'
import { createTransactionFormSchema } from '~/routes/transactions/lib/schemas'
import {
	createTransaction,
	getTransactionBalance,
} from '~/routes/transactions/lib/queries'
import { createTransferFormSchema } from '~/routes/transfers/lib/schemas'
import {
	getTransferBalance,
	createTransfer,
} from '~/routes/transfers/lib/queries'
import { createExchangeFormSchema } from '~/routes/exchanges/lib/schemas'
import {
	getExchangeBalance,
	createExchange,
} from '~/routes/exchanges/lib/queries'

import {
	MOVEMENT_TABS,
	MOVEMENT_TAB_TRANSACTIONS,
	MOVEMENT_TAB_TRANSFERS,
	MOVEMENT_TAB_EXCHANGES,
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
	return { movement, formData }
}

export async function action({ request, context, params }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const movement = MOVEMENT_TABS.find(t => t === params.movement)
	if (!movement) {
		throw new Response('Not Found', { status: 404 })
	}

	const formData = await request.formData()

	const tm = getServerT(context, 'movements')

	if (movement === MOVEMENT_TAB_TRANSACTIONS) {
		const t = getServerT(context, 'transactions')

		const submission = parseWithZod(formData, {
			schema: createTransactionFormSchema(t),
		})
		if (submission.status !== 'success') {
			return data({ submission: submission.reply() }, { status: 422 })
		}

		if (submission.value.action !== ACTION_CREATION) {
			throw new Response(
				tm('create.transactions.action.invalidActionError'),
				{ status: 422 },
			)
		}

		const { action: _action, ...values } = submission.value
		const amount = Number(values.amount) * 100

		const account = await getAccountById({
			db,
			accountId: values.accountId,
		})
		if (!account || account.ownerId !== user.id) {
			return data(
				{
					submission: submission.reply({
						fieldErrors: {
							accountId: [
								tm(
									'create.transactions.action.accountNotFound',
								),
							],
						},
					}),
				},
				{ status: 422 },
			)
		}

		const currency = await getCurrencyById({
			db,
			currencyId: values.currencyId,
		})
		if (!currency) {
			return data(
				{
					submission: submission.reply({
						fieldErrors: {
							currencyId: [
								tm(
									'create.transactions.action.currencyNotFound',
								),
							],
						},
					}),
				},
				{ status: 422 },
			)
		}

		const result = await getTransactionBalance({
			db,
			ownerId: user.id,
			accountId: values.accountId,
			currencyId: values.currencyId,
		})
		if (
			values.type === TRANSACTION_TYPE_EXPENSE &&
			(!result || result.balance < amount)
		) {
			return data(
				{
					submission: submission.reply({
						fieldErrors: {
							amount: [
								tm(
									'create.transactions.action.insufficientBalance',
								),
							],
						},
					}),
				},
				{ status: 422 },
			)
		}

		await createTransaction({ db, data: { ...values, amount } })

		return await redirectWithToast(
			`/app/movements?tab=transactions`,
			request,
			{
				type: 'success',
				title: tm('create.transactions.action.successToast'),
			},
		)
	}

	if (movement === MOVEMENT_TAB_TRANSFERS) {
		const t = getServerT(context, 'transfers')

		const submission = parseWithZod(formData, {
			schema: createTransferFormSchema(t),
		})
		if (submission.status !== 'success') {
			return data({ submission: submission.reply() }, { status: 422 })
		}

		const { fromAccountId, toAccountId, currencyId } = submission.value
		const amount = Number(submission.value.amount) * 100

		const fromAccount = await getAccountById({
			db,
			accountId: fromAccountId,
		})
		if (!fromAccount || fromAccount.ownerId !== user.id) {
			return data(
				{
					submission: submission.reply({
						fieldErrors: {
							fromAccountId: [
								tm(
									'create.transfers.action.fromAccountNotFound',
								),
							],
						},
					}),
				},
				{ status: 422 },
			)
		}

		const toAccount = await getAccountById({ db, accountId: toAccountId })
		if (!toAccount || toAccount.ownerId !== user.id) {
			return data(
				{
					submission: submission.reply({
						fieldErrors: {
							toAccountId: [
								tm('create.transfers.action.toAccountNotFound'),
							],
						},
					}),
				},
				{ status: 422 },
			)
		}

		const currency = await getCurrencyById({ db, currencyId })
		if (!currency) {
			return data(
				{
					submission: submission.reply({
						fieldErrors: {
							currencyId: [
								tm('create.transfers.action.currencyNotFound'),
							],
						},
					}),
				},
				{ status: 422 },
			)
		}

		const balance = await getTransferBalance({
			db,
			ownerId: user.id,
			accountId: fromAccountId,
			currencyId,
		})
		if (!balance || balance.balance < amount) {
			return data(
				{
					submission: submission.reply({
						fieldErrors: {
							amount: [
								tm(
									'create.transfers.action.insufficientBalance',
								),
							],
						},
					}),
				},
				{ status: 422 },
			)
		}

		await createTransfer({
			db,
			values: {
				date: submission.value.date,
				amount,
				currencyId,
				fromAccountId,
				toAccountId,
			},
		})

		return await redirectWithToast(
			`/app/movements?tab=transfers`,
			request,
			{
				type: 'success',
				title: tm('create.transfers.action.successToast'),
			},
		)
	}

	if (movement === MOVEMENT_TAB_EXCHANGES) {
		const t = getServerT(context, 'exchanges')

		const submission = parseWithZod(formData, {
			schema: createExchangeFormSchema(t),
		})
		if (submission.status !== 'success') {
			return data({ submission: submission.reply() }, { status: 422 })
		}

		const { accountId, fromCurrencyId, toCurrencyId } = submission.value
		const fromAmount = Number(submission.value.fromAmount) * 100
		const toAmount = Number(submission.value.toAmount) * 100

		const account = await getAccountById({ db, accountId })
		if (!account || account.ownerId !== user.id) {
			return data(
				{
					submission: submission.reply({
						fieldErrors: {
							accountId: [
								tm('create.exchanges.action.accountNotFound'),
							],
						},
					}),
				},
				{ status: 422 },
			)
		}

		const fromCurrency = await getCurrencyById({
			db,
			currencyId: fromCurrencyId,
		})
		if (!fromCurrency) {
			return data(
				{
					submission: submission.reply({
						fieldErrors: {
							fromCurrencyId: [
								tm(
									'create.exchanges.action.fromCurrencyNotFound',
								),
							],
						},
					}),
				},
				{ status: 422 },
			)
		}

		const toCurrency = await getCurrencyById({
			db,
			currencyId: toCurrencyId,
		})
		if (!toCurrency) {
			return data(
				{
					submission: submission.reply({
						fieldErrors: {
							toCurrencyId: [
								tm(
									'create.exchanges.action.toCurrencyNotFound',
								),
							],
						},
					}),
				},
				{ status: 422 },
			)
		}

		const balance = await getExchangeBalance({
			db,
			ownerId: user.id,
			accountId,
			currencyId: fromCurrencyId,
		})
		if (!balance || balance.balance < fromAmount) {
			return data(
				{
					submission: submission.reply({
						fieldErrors: {
							fromAmount: [
								tm(
									'create.exchanges.action.insufficientBalance',
								),
							],
						},
					}),
				},
				{ status: 422 },
			)
		}

		await createExchange({
			db,
			values: {
				date: submission.value.date,
				fromAmount,
				toAmount,
				fromCurrencyId,
				toCurrencyId,
				accountId,
			},
		})

		return await redirectWithToast(
			`/app/movements?tab=exchanges`,
			request,
			{
				type: 'success',
				title: tm('create.exchanges.action.successToast'),
			},
		)
	}

	throw new Response('Not Found', { status: 404 })
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
