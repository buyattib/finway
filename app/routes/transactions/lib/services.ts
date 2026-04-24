import { data, type RouterContextProvider } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import {
	createToastHeaders,
	redirectWithToast,
} from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { getBalances, getCurrencyById } from '~/lib/queries'
import { ACTION_CREATION, ACTION_EDITION } from '~/lib/constants'
import type { DB, UserAuth } from '~/lib/types'

import { getAccountById } from '~/routes/accounts/lib/queries'

import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
} from './constants'
import { createTransactionFormSchema } from './schemas'
import {
	createTransaction,
	deleteTransaction,
	getTransactionBalance,
	getTransactionById,
	updateTransaction,
} from './queries'

export async function createTransactionAction({
	db,
	user,
	request,
	context,
	formData,
}: {
	db: DB
	user: UserAuth
	request: Request
	context: Readonly<RouterContextProvider>
	formData: FormData
}) {
	const t = getServerT(context, 'transactions')

	const submission = parseWithZod(formData, {
		schema: createTransactionFormSchema(t),
	})
	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_CREATION) {
		throw new Response(t('form.create.invalidActionError'), {
			status: 422,
		})
	}

	const { action: _action, ...values } = submission.value
	const amount = Number(values.amount) * 100

	const account = await getAccountById({ db, accountId: values.accountId })
	if (!account || account.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						accountId: [
							t('form.create.accountNotFound'),
						],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const currency = await getCurrencyById({ db, currencyId: values.currencyId })
	if (!currency) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						currencyId: [
							t('form.create.currencyNotFound'),
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
							t('form.create.insufficientBalance'),
						],
					},
				}),
			},
			{ status: 422 },
		)
	}

	await createTransaction({ db, data: { ...values, amount } })

	return await redirectWithToast(`/app/movements?tab=transactions`, request, {
		type: 'success',
		title: t('form.create.successToast'),
	})
}

export async function editTransactionAction({
	db,
	user,
	request,
	context,
	formData,
}: {
	db: DB
	user: UserAuth
	request: Request
	context: Readonly<RouterContextProvider>
	formData: FormData
}) {
	const t = getServerT(context, 'transactions')

	const submission = parseWithZod(formData, {
		schema: createTransactionFormSchema(t),
	})
	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_EDITION) {
		throw new Response(t('form.edit.invalidActionError'), {
			status: 422,
		})
	}

	const { action: _action, id: transactionId, ...values } = submission.value
	const amount = Number(values.amount) * 100

	const existingTransaction = await getTransactionById({ db, transactionId })
	if (
		!existingTransaction ||
		existingTransaction.account.ownerId !== user.id
	) {
		return data(
			{
				submission: submission.reply({
					formErrors: [t('form.edit.transactionNotFound')],
				}),
			},
			{ status: 422 },
		)
	}

	const account = await getAccountById({ db, accountId: values.accountId })
	if (!account || account.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						accountId: [t('form.edit.accountNotFound')],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const currency = await getCurrencyById({ db, currencyId: values.currencyId })
	if (!currency) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						currencyId: [t('form.edit.currencyNotFound')],
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
	let balance = !result ? 0 : result.balance

	if (
		existingTransaction.currencyId === values.currencyId &&
		existingTransaction.accountId === values.accountId
	) {
		balance += {
			[TRANSACTION_TYPE_EXPENSE]: existingTransaction.amount,
			[TRANSACTION_TYPE_INCOME]: -existingTransaction.amount,
		}[existingTransaction.type]
	}

	if (values.type === TRANSACTION_TYPE_EXPENSE && balance < amount) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						amount: [t('form.edit.insufficientBalance')],
					},
				}),
			},
			{ status: 422 },
		)
	}

	await updateTransaction({
		db,
		transactionId,
		data: { ...values, amount },
	})

	return await redirectWithToast(`/app/movements?tab=transactions`, request, {
		type: 'success',
		title: t('form.edit.successToast'),
	})
}

export async function deleteTransactionAction({
	db,
	user,
	request,
	context,
	transactionId,
}: {
	db: DB
	user: UserAuth
	request: Request
	context: Readonly<RouterContextProvider>
	transactionId: string
}) {
	const t = getServerT(context, 'transactions')

	const transaction = await getTransactionById({ db, transactionId })
	if (!transaction || transaction.account.ownerId !== user.id) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: t('index.action.notFoundError', { transactionId }),
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

	await deleteTransaction({ db, transactionId })

	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: t('index.action.successToast'),
	})
	return data({}, { headers: toastHeaders })
}
