import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types/create'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import { getBalances, getCurrencyById, getSelectData } from '~/lib/queries'
import { ACTION_CREATION } from '~/lib/constants'

import { getAccountById } from '~/routes/accounts/lib/queries'

import {
	TRANSACTION_CATEGORIES,
	TRANSACTION_TYPE_EXPENSE,
} from './lib/constants'
import { createTransactionFormSchema } from './lib/schemas'
import { createTransaction, getTransactionBalance } from './lib/queries'
import { TransactionForm, type TInitialData } from './components/form'

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

	const [selectData, balances] = await Promise.all([
		getSelectData(db, user.id),
		getBalances({ db, ownerId: user.id, parseBalance: true }),
	])

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
		balances,
		initialData: {
			type: TRANSACTION_TYPE_EXPENSE,
			amount: '',
			description: '',
			accountId,
			currencyId,
			category: TRANSACTION_CATEGORIES[0],
		} satisfies Partial<TInitialData>,
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
	const submission = parseWithZod(formData, {
		schema: createTransactionFormSchema(t),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_CREATION) {
		throw new Response(t('form.create.action.invalidActionError'), {
			status: 422,
		})
	}

	const { action: _action, ...values } = submission.value
	const amount = Number(values.amount) * 100

	const account = await getAccountById({ db, accountId: values.accountId })
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

	const currency = await getCurrencyById({
		db,
		currencyId: values.currencyId,
	})
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

	const result = await getTransactionBalance({
		db,
		ownerId: user.id,
		accountId: values.accountId,
		currencyId: values.currencyId,
	})
	if (
		values.type === TRANSACTION_TYPE_EXPENSE &&
		(!result || result.balance < amount)
	) {
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

	await createTransaction({
		db,
		data: { ...values, amount },
	})

	return await redirectWithToast(`/app/transactions`, request, {
		type: 'success',
		title: t('form.create.action.successToast'),
	})
}

export default function CreateTransaction({
	loaderData: { selectData, balances, initialData },
	actionData,
}: Route.ComponentProps) {
	return (
		<TransactionForm
			action={ACTION_CREATION}
			lastResult={actionData?.submission}
			selectData={selectData}
			balances={balances}
			initialData={initialData}
		/>
	)
}
