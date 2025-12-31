import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'
import type { Route } from './+types/create'

import { dbContext, userContext } from '~/lib/context'
import { transaction as transactionTable } from '~/database/schema'
import { removeCommas } from '~/lib/utils'
import { redirectWithToast } from '~/utils-server/toast.server'

import { getAccountCurrencyBalance } from '~/routes/accounts/lib/queries'

import { TransactionFormSchema } from './lib/schemas'
import { TRANSACTION_TYPE_EXPENSE, ACTION_CREATION } from './lib/constants'
import { getSelectData } from './lib/queries'
import { TransactionForm } from './components/form'

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	return await getSelectData(db, user.id)
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

			const balance = await getAccountCurrencyBalance(
				db,
				data.accountId,
				data.currencyId,
			)

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

	if (submission.value.action !== ACTION_CREATION) {
		throw new Response('Invalid action', { status: 422 })
	}

	const { action, ...transactionData } = submission.value

	await db.insert(transactionTable).values(transactionData)

	return await redirectWithToast(`/app/transactions`, request, {
		type: 'success',
		title: 'Transaction created successfully',
	})
}

export default function CreateTransaction({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	return (
		<TransactionForm
			action={ACTION_CREATION}
			lastResult={actionData?.submission}
			{...loaderData}
		/>
	)
}
