import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types/edit'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import { getCurrencyById } from '~/lib/queries'
import { ACTION_EDITION } from '~/lib/constants'

import { getAccountById } from '~/routes/accounts/lib/queries'

import { createTransferFormSchema } from './lib/schemas'
import {
	getTransferById,
	getTransferBalance,
	updateTransfer,
} from './lib/queries'

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

	if (submission.value.action !== ACTION_EDITION) {
		throw new Response(t('form.edit.action.invalidActionError'), {
			status: 422,
		})
	}

	const { action: _action, id: transferId, ...values } = submission.value
	const amount = Number(values.amount) * 100

	const existingTransfer = await getTransferById({ db, transferId })
	if (
		!existingTransfer ||
		existingTransfer.fromAccount.ownerId !== user.id ||
		existingTransfer.toAccount.ownerId !== user.id
	) {
		return data(
			{
				submission: submission.reply({
					formErrors: [t('form.edit.action.transferNotFound')],
				}),
			},
			{ status: 422 },
		)
	}

	const fromAccount = await getAccountById({
		db,
		accountId: values.fromAccountId,
	})
	if (!fromAccount || fromAccount.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						fromAccountId: [
							t('form.edit.action.fromAccountNotFound'),
						],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const toAccount = await getAccountById({
		db,
		accountId: values.toAccountId,
	})
	if (!toAccount || toAccount.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						toAccountId: [t('form.edit.action.toAccountNotFound')],
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
						currencyId: [t('form.edit.action.currencyNotFound')],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const result = await getTransferBalance({
		db,
		ownerId: user.id,
		accountId: values.fromAccountId,
		currencyId: values.currencyId,
	})
	let balance = result.balance

	if (
		existingTransfer.currencyId === values.currencyId &&
		existingTransfer.fromAccountId === values.fromAccountId
	) {
		balance += existingTransfer.amount
	}

	if (balance < amount) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						amount: [t('form.edit.action.insufficientBalance')],
					},
				}),
			},
			{ status: 422 },
		)
	}

	await updateTransfer({
		db,
		transferId,
		data: { ...values, amount },
	})

	return await redirectWithToast(`/app/movements?tab=transfers`, request, {
		type: 'success',
		title: t('form.edit.action.successToast'),
	})
}
