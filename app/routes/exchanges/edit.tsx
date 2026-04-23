import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types/edit'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import { getCurrencyById } from '~/lib/queries'
import { ACTION_EDITION } from '~/lib/constants'

import { getAccountById } from '~/routes/accounts/lib/queries'

import { createExchangeFormSchema } from './lib/schemas'
import {
	getExchangeById,
	getExchangeBalance,
	updateExchange,
} from './lib/queries'

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'exchanges')

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: createExchangeFormSchema(t),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_EDITION) {
		throw new Response(t('form.edit.action.invalidActionError'), {
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
					formErrors: [t('form.edit.action.exchangeNotFound')],
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
						accountId: [t('form.edit.action.accountNotFound')],
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
							t('form.edit.action.fromCurrencyNotFound'),
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
						toCurrencyId: [
							t('form.edit.action.toCurrencyNotFound'),
						],
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
						fromAmount: [t('form.edit.action.insufficientBalance')],
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
		title: t('form.edit.action.successToast'),
	})
}
