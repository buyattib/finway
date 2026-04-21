import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'
import type { Route } from './+types/create'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { getCurrencyById } from '~/lib/queries'

import { getAccountById } from '~/routes/accounts/lib/queries'

import { getExchangeBalance, createExchange } from './lib/queries'
import { createExchangeFormSchema } from './lib/schemas'

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

	const { accountId, fromCurrencyId, toCurrencyId } = submission.value
	const fromAmount = Number(submission.value.fromAmount) * 100
	const toAmount = Number(submission.value.toAmount) * 100

	const account = await getAccountById({ db, accountId })
	if (!account || account.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						accountId: [t('form.create.action.accountNotFound')],
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
							t('form.create.action.fromCurrencyNotFound'),
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
							t('form.create.action.toCurrencyNotFound'),
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
							t('form.create.action.insufficientBalance'),
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
		title: t('form.create.action.successToast'),
	})
}
