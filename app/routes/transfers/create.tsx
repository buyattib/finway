import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'
import type { Route } from './+types/create'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { getCurrencyById } from '~/lib/queries'

import { getAccountById } from '~/routes/accounts/lib/queries'

import { getTransferBalance, createTransfer } from './lib/queries'
import { createTransferFormSchema } from './lib/schemas'

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'transfers')

	const formData = await request.formData()

	const submission = parseWithZod(formData, {
		schema: createTransferFormSchema(t),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	const { fromAccountId, toAccountId, currencyId } = submission.value
	const amount = Number(submission.value.amount) * 100

	const fromAccount = await getAccountById({ db, accountId: fromAccountId })
	if (!fromAccount || fromAccount.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						fromAccountId: [
							t('form.create.action.fromAccountNotFound'),
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
							t('form.create.action.toAccountNotFound'),
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
						currencyId: [t('form.create.action.currencyNotFound')],
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
						amount: [t('form.create.action.insufficientBalance')],
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

	return await redirectWithToast(`/app/movements?tab=transfers`, request, {
		type: 'success',
		title: t('form.create.action.successToast'),
	})
}
