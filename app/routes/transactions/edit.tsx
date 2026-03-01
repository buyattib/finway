import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'
import { eq, sql } from 'drizzle-orm'

import type { Route } from './+types/edit'

import { transaction as transactionTable } from '~/database/schema'
import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import { removeCommas } from '~/lib/utils'
import { getBalances, getSelectData } from '~/lib/queries'
import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
	ACTION_EDITION,
} from '~/lib/constants'

import { createTransactionFormSchema } from './lib/schemas'
import { TransactionForm } from './components/form'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({
	context,
	params: { transactionId },
}: Route.LoaderArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'transactions')

	const transaction = await db.query.transaction.findFirst({
		where: (transaction, { eq }) => eq(transaction.id, transactionId),
		columns: {
			id: true,
			date: true,
			type: true,
			description: true,

			currencyId: true,
			accountId: true,
			transactionCategoryId: true,
		},
		extras: {
			amount: sql<string>`CAST(${transactionTable.amount} / 100.0 AS TEXT)`.as(
				'amount',
			),
		},
		with: { account: { columns: { ownerId: true } } },
	})

	if (!transaction || transaction.account.ownerId !== user.id) {
		throw new Response(t('form.edit.loader.notFoundError'), { status: 404 })
	}

	const { account: _account, ...transactionData } = transaction

	const selectData = await getSelectData(db, user.id)
	return {
		selectData,
		initialData: {
			...transactionData,
			transactionCategoryId: transactionData.transactionCategoryId ?? '',
		},
		meta: {
			title: t('form.edit.meta.title', { transactionId }),
			description: t('form.edit.meta.description', { transactionId }),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'transactions')

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		async: true,
		schema: createTransactionFormSchema(t)
			.transform(data => ({
				...data,
				amount: Number(removeCommas(data.amount)) * 100,
			}))
			.superRefine(async (data, ctx) => {
				if (data.action !== ACTION_EDITION) return

				// Existing transaction
				const transaction = await db.query.transaction.findFirst({
					where: (transaction, { eq }) => eq(transaction.id, data.id),
					columns: {
						type: true,
						amount: true,
						accountId: true,
						currencyId: true,
					},
					with: { account: { columns: { ownerId: true } } },
				})
				if (!transaction || transaction.account.ownerId !== user.id) {
					return ctx.addIssue({
						code: 'custom',
						message: t('form.edit.action.transactionNotFound'),
					})
				}

				// New account
				const account = await db.query.account.findFirst({
					where: (account, { eq }) => eq(account.id, data.accountId),
					columns: { ownerId: true },
				})
				if (!account || account.ownerId !== user.id) {
					return ctx.addIssue({
						code: 'custom',
						message: t('form.edit.action.accountNotFound'),
						path: ['accountId'],
					})
				}

				// New currency
				const currency = await db.query.currency.findFirst({
					where: (currency, { eq }) =>
						eq(currency.id, data.currencyId),
					columns: { id: true },
				})
				if (!currency) {
					return ctx.addIssue({
						code: 'custom',
						message: t('form.edit.action.currencyNotFound'),
						path: ['currencyId'],
					})
				}

				// New transaction category
				const transactionCategory =
					await db.query.transactionCategory.findFirst({
						where: (transactionCategory, { eq }) =>
							eq(
								transactionCategory.id,
								data.transactionCategoryId,
							),
						columns: { ownerId: true },
					})
				if (
					!transactionCategory ||
					transactionCategory.ownerId !== user.id
				) {
					return ctx.addIssue({
						code: 'custom',
						message: t('form.edit.action.categoryNotFound'),
						path: ['transactionCategoryId'],
					})
				}

				// Current balance for account and currency
				const { accountId, currencyId } = data
				const [result] = await getBalances({
					db,
					ownerId: user.id,
					accountId,
					currencyId,
					parseBalance: false,
				})
				let balance = !result ? 0 : result.balance

				// Balance for account and currency before the transaction
				if (
					transaction.currencyId === data.currencyId &&
					transaction.accountId === data.accountId
				) {
					balance += {
						[TRANSACTION_TYPE_EXPENSE]: transaction.amount,
						[TRANSACTION_TYPE_INCOME]: -transaction.amount,
					}[transaction.type]
				}

				if (
					data.type === TRANSACTION_TYPE_EXPENSE &&
					balance < data.amount
				) {
					return ctx.addIssue({
						code: 'custom',
						message: t('form.edit.action.insufficientBalance'),
						path: ['amount'],
					})
				}
			}),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_EDITION) {
		throw new Response(t('form.edit.action.invalidActionError'), { status: 422 })
	}

	const { action: _action, id: transactionId, ...transactionData } = submission.value

	await db
		.update(transactionTable)
		.set(transactionData)
		.where(eq(transactionTable.id, transactionId))

	return await redirectWithToast(`/app/transactions`, request, {
		type: 'success',
		title: t('form.edit.action.successToast'),
	})
}

export default function CreateTransaction({
	loaderData: { selectData, initialData },
	actionData,
}: Route.ComponentProps) {
	return (
		<TransactionForm
			action={ACTION_EDITION}
			lastResult={actionData?.submission}
			selectData={selectData}
			initialData={initialData}
		/>
	)
}
