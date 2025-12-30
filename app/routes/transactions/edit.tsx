import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'
import { and, eq, sql } from 'drizzle-orm'
import type { Route } from './+types/edit'

import { dbContext, userContext } from '~/lib/context'
import { transaction as transactionTable } from '~/database/schema'
import { removeCommas } from '~/lib/utils'
import { redirectWithToast } from '~/utils-server/toast.server'

import { TransactionFormSchema } from './lib/schemas'
import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
	ACTION_EDITION,
} from './lib/constants'
import { getSelectData } from './lib/queries'
import { TransactionForm } from './components/form'

export async function loader({
	context,
	params: { transactionId },
}: Route.LoaderArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const transaction = await db.query.transaction.findFirst({
		where: (transaction, { eq }) => eq(transaction.id, transactionId),
		columns: {
			id: true,
			date: true,
			amount: true,
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
		throw new Response('Transaction not found', { status: 404 })
	}

	const { account, ...transactionData } = transaction

	const data = await getSelectData(db, user.id)
	return {
		transaction: {
			...transactionData,
			transactionCategoryId: transactionData.transactionCategoryId ?? '',
		},
		...data,
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		async: true,
		schema: TransactionFormSchema.transform(data => ({
			...data,
			amount: Number(removeCommas(data.amount)) * 100,
		})).superRefine(async (data, ctx) => {
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
					message: 'Transaction not found',
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
					message: 'Account not found',
					path: ['accountId'],
				})
			}

			// New currency
			const currency = await db.query.currency.findFirst({
				where: (currency, { eq }) => eq(currency.id, data.currencyId),
				columns: { id: true },
			})
			if (!currency) {
				return ctx.addIssue({
					code: 'custom',
					message: 'Currency not found',
					path: ['currencyId'],
				})
			}

			// New transaction category
			const transactionCategory =
				await db.query.transactionCategory.findFirst({
					where: (transactionCategory, { eq }) =>
						eq(transactionCategory.id, data.transactionCategoryId),
					columns: { ownerId: true },
				})
			if (
				!transactionCategory ||
				transactionCategory.ownerId !== user.id
			) {
				return ctx.addIssue({
					code: 'custom',
					message: 'Transaction category not found',
					path: ['transactionCategoryId'],
				})
			}

			// Current balance for account and currency
			let [{ balance }] = await db
				.select({
					balance: sql<number>`COALESCE(
						SUM(
							CASE 
								WHEN ${transactionTable.type} = ${TRANSACTION_TYPE_INCOME} THEN ${transactionTable.amount}
								WHEN ${transactionTable.type} = ${TRANSACTION_TYPE_EXPENSE} THEN -${transactionTable.amount}
								ELSE 0
							END
						), 0)`,
				})
				.from(transactionTable)
				.where(
					and(
						eq(transactionTable.accountId, transaction.accountId),
						eq(transactionTable.currencyId, transaction.currencyId),
					),
				)

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
					message:
						'Insufficient balance for the selected account and currency',
					path: ['amount'],
				})
			}
		}),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_EDITION) {
		throw new Response('Invalid action', { status: 422 })
	}

	const { action, id: transactionId, ...transactionData } = submission.value

	await db
		.update(transactionTable)
		.set(transactionData)
		.where(eq(transactionTable.id, transactionId))

	return await redirectWithToast(`/app/transactions`, request, {
		type: 'success',
		title: 'Transaction created successfully',
	})
}

export default function CreateTransaction({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { transaction, ...selectData } = loaderData
	return (
		<TransactionForm
			action={ACTION_EDITION}
			lastResult={actionData?.submission}
			transaction={transaction}
			{...selectData}
		/>
	)
}
