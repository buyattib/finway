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

import { createTransferFormSchema } from './schemas'
import {
	createTransfer,
	deleteTransfer,
	getTransferBalance,
	getTransferById,
	updateTransfer,
} from './queries'

export async function createTransferAction({
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
	const t = getServerT(context, 'transfers')

	const url = new URL(request.url)
	const search = url.search

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
						fromAccountId: [t('form.create.fromAccountNotFound')],
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
						toAccountId: [t('form.create.toAccountNotFound')],
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
						currencyId: [t('form.create.currencyNotFound')],
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
						amount: [t('form.create.insufficientBalance')],
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

	return await redirectWithToast(`/app/movements${search}`, request, {
		type: 'success',
		title: t('form.create.successToast'),
	})
}

export async function editTransferAction({
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
	const t = getServerT(context, 'transfers')

	const url = new URL(request.url)
	const search = url.search

	const submission = parseWithZod(formData, {
		schema: createTransferFormSchema(t),
	})
	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_EDITION) {
		throw new Response(t('form.edit.invalidActionError'), {
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
					formErrors: [t('form.edit.transferNotFound')],
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
						fromAccountId: [t('form.edit.fromAccountNotFound')],
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
						toAccountId: [t('form.edit.toAccountNotFound')],
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
						currencyId: [t('form.edit.currencyNotFound')],
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
						amount: [t('form.edit.insufficientBalance')],
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

	return await redirectWithToast(`/app/movements${search}`, request, {
		type: 'success',
		title: t('form.edit.successToast'),
	})
}

export async function deleteTransferAction({
	db,
	user,
	request,
	context,
	transferId,
}: {
	db: DB
	user: UserAuth
	request: Request
	context: Readonly<RouterContextProvider>
	transferId: string
}) {
	const t = getServerT(context, 'transfers')

	const transfer = await getTransferById({ db, transferId })
	if (
		!transfer ||
		(transfer.fromAccount && transfer.fromAccount.ownerId !== user.id) ||
		(transfer.toAccount && transfer.toAccount.ownerId !== user.id)
	) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: t('index.action.notFoundError', { transferId }),
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

	await deleteTransfer({ db, transferId })

	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: t('index.action.successToast'),
	})
	return data({}, { headers: toastHeaders })
}
