import { data, type RouterContextProvider } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import {
	createToastHeaders,
	redirectWithToast,
} from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { getCurrencyById } from '~/lib/queries'
import { ACTION_EDITION } from '~/lib/constants'
import type { DB, UserAuth } from '~/lib/types'

import { getAccountById } from '~/routes/accounts/lib/queries'

import { createExchangeFormSchema } from './schemas'
import {
	createExchange,
	deleteExchange,
	getExchangeBalance,
	getExchangeById,
	updateExchange,
} from './queries'

export async function createExchangeAction({
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
							t('form.create.accountNotFound'),
						],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const fromCurrency = await getCurrencyById({ db, currencyId: fromCurrencyId })
	if (!fromCurrency) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						fromCurrencyId: [
							t('form.create.fromCurrencyNotFound'),
						],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const toCurrency = await getCurrencyById({ db, currencyId: toCurrencyId })
	if (!toCurrency) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						toCurrencyId: [
							t('form.create.toCurrencyNotFound'),
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
							t('form.create.insufficientBalance'),
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

	return await redirectWithToast(`/app/movements?tab=exchanges`, request, {
		type: 'success',
		title: t('form.create.successToast'),
	})
}

export async function editExchangeAction({
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
	const t = getServerT(context, 'exchanges')

	const submission = parseWithZod(formData, {
		schema: createExchangeFormSchema(t),
	})
	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_EDITION) {
		throw new Response(t('form.edit.invalidActionError'), {
			status: 422,
		})
	}

	const { action: _action, id: exchangeId, ...values } = submission.value
	const fromAmount = Number(values.fromAmount) * 100
	const toAmount = Number(values.toAmount) * 100

	const existingExchange = await getExchangeById({ db, exchangeId })
	if (!existingExchange || existingExchange.account.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					formErrors: [t('form.edit.exchangeNotFound')],
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

	const fromCurrency = await getCurrencyById({
		db,
		currencyId: values.fromCurrencyId,
	})
	if (!fromCurrency) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						fromCurrencyId: [
							t('form.edit.fromCurrencyNotFound'),
						],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const toCurrency = await getCurrencyById({
		db,
		currencyId: values.toCurrencyId,
	})
	if (!toCurrency) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						toCurrencyId: [t('form.edit.toCurrencyNotFound')],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const result = await getExchangeBalance({
		db,
		ownerId: user.id,
		accountId: values.accountId,
		currencyId: values.fromCurrencyId,
	})
	let balance = result.balance

	if (
		existingExchange.accountId === values.accountId &&
		existingExchange.fromCurrencyId === values.fromCurrencyId
	) {
		balance += existingExchange.fromAmount
	}

	if (balance < fromAmount) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						fromAmount: [t('form.edit.insufficientBalance')],
					},
				}),
			},
			{ status: 422 },
		)
	}

	await updateExchange({
		db,
		exchangeId,
		data: { ...values, fromAmount, toAmount },
	})

	return await redirectWithToast(`/app/movements?tab=exchanges`, request, {
		type: 'success',
		title: t('form.edit.successToast'),
	})
}

export async function deleteExchangeAction({
	db,
	user,
	request,
	context,
	exchangeId,
}: {
	db: DB
	user: UserAuth
	request: Request
	context: Readonly<RouterContextProvider>
	exchangeId: string
}) {
	const t = getServerT(context, 'exchanges')

	const exchange = await getExchangeById({ db, exchangeId })
	if (!exchange || exchange.account.ownerId !== user.id) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: t('index.action.notFoundError', { exchangeId }),
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

	await deleteExchange({ db, exchangeId })

	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: t('index.action.successToast'),
	})
	return data({}, { headers: toastHeaders })
}
