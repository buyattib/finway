import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types/create'

import { transaction as transactionTable } from '~/database/schema'
import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import { removeCommas } from '~/lib/utils'
import { getBalances, getSelectData } from '~/lib/queries'
import { TRANSACTION_TYPE_EXPENSE, ACTION_CREATION } from '~/lib/constants'

import { createTransactionFormSchema } from './lib/schemas'
import { TransactionForm } from './components/form'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'transactions')

	const url = new URL(request.url)
	const accountIdParam = url.searchParams.get('accountId')
	const currencyIdParam = url.searchParams.get('currencyId')

	const selectData = await getSelectData(db, user.id)

	let accountId = selectData.accounts?.[0]?.id || ''
	if (
		accountIdParam &&
		selectData.accounts.some(acc => acc.id === accountIdParam)
	) {
		accountId = accountIdParam
	}

	let currencyId = selectData.currencies[0].id
	if (
		currencyIdParam &&
		selectData.currencies.filter(c => c.id === currencyIdParam)
	) {
		currencyId = currencyIdParam
	}

	return {
		selectData,
		initialData: {
			type: TRANSACTION_TYPE_EXPENSE,
			amount: '0',
			description: '',
			accountId,
			currencyId,
			transactionCategoryId:
				selectData.transactionCategories?.[0]?.id || '',
		} as const,
		meta: {
			title: t('form.create.meta.title'),
			description: t('form.create.meta.description'),
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
				const account = await db.query.account.findFirst({
					where: (account, { eq }) => eq(account.id, data.accountId),
					columns: { ownerId: true },
				})
				if (!account || account.ownerId !== user.id) {
					return ctx.addIssue({
						code: 'custom',
						message: t('form.create.action.accountNotFound'),
						path: ['accountId'],
					})
				}

				const currency = await db.query.currency.findFirst({
					where: (currency, { eq }) =>
						eq(currency.id, data.currencyId),
					columns: { id: true },
				})
				if (!currency) {
					return ctx.addIssue({
						code: 'custom',
						message: t('form.create.action.currencyNotFound'),
						path: ['currencyId'],
					})
				}

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
						message: t('form.create.action.categoryNotFound'),
						path: ['transactionCategoryId'],
					})
				}

				const { accountId, currencyId } = data
				const [result] = await getBalances({
					db,
					ownerId: user.id,
					accountId,
					currencyId,
					parseBalance: false,
				})
				if (
					data.type === TRANSACTION_TYPE_EXPENSE &&
					(!result || result.balance < data.amount)
				) {
					return ctx.addIssue({
						code: 'custom',
						message: t('form.create.action.insufficientBalance'),
						path: ['amount'],
					})
				}
			}),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_CREATION) {
		throw new Response(t('form.create.action.invalidActionError'), { status: 422 })
	}

	const { action, ...transactionData } = submission.value

	await db.insert(transactionTable).values(transactionData)

	return await redirectWithToast(`/app/transactions`, request, {
		type: 'success',
		title: t('form.create.action.successToast'),
	})
}

export default function CreateTransaction({
	loaderData: { selectData, initialData },
	actionData,
}: Route.ComponentProps) {
	return (
		<TransactionForm
			action={ACTION_CREATION}
			lastResult={actionData?.submission}
			selectData={selectData}
			initialData={initialData}
		/>
	)
}
