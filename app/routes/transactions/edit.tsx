import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types/edit'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import { removeCommas } from '~/lib/utils'
import { getBalances, getCurrencyById, getSelectData } from '~/lib/queries'
import { ACTION_EDITION } from '~/lib/constants'

import { getAccountById } from '~/routes/accounts/lib/queries'
import { getTransactionCategoryById } from '~/routes/transaction-categories/lib/queries'

import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
} from './lib/constants'
import { createTransactionFormSchema } from './lib/schemas'
import {
	getTransactionById,
	getTransactionBalance,
	updateTransaction,
} from './lib/queries'
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

	const transaction = await getTransactionById({ db, transactionId })

	if (!transaction || transaction.account.ownerId !== user.id) {
		throw new Response(t('form.edit.loader.notFoundError'), { status: 404 })
	}

	const { account: _account, amount: rawAmount, ...transactionData } = transaction
	const amount = (rawAmount / 100).toString()

	const [selectData, balances] = await Promise.all([
		getSelectData(db, user.id),
		getBalances({ db, ownerId: user.id, parseBalance: true }),
	])

	return {
		selectData,
		balances,
		initialData: {
			...transactionData,
			amount,
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
	const submission = parseWithZod(formData, {
		schema: createTransactionFormSchema(t),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_EDITION) {
		throw new Response(t('form.edit.action.invalidActionError'), {
			status: 422,
		})
	}

	const { action: _action, id: transactionId, ...values } = submission.value
	const amount = Number(removeCommas(values.amount)) * 100

	const existingTransaction = await getTransactionById({
		db,
		transactionId,
	})
	if (
		!existingTransaction ||
		existingTransaction.account.ownerId !== user.id
	) {
		return data(
			{
				submission: submission.reply({
					formErrors: [t('form.edit.action.transactionNotFound')],
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

	const transactionCategory = await getTransactionCategoryById({
		db,
		transactionCategoryId: values.transactionCategoryId,
	})
	if (!transactionCategory || transactionCategory.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						transactionCategoryId: [
							t('form.edit.action.categoryNotFound'),
						],
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
	let balance = !result ? 0 : result.balance

	if (
		existingTransaction.currencyId === values.currencyId &&
		existingTransaction.accountId === values.accountId
	) {
		balance += {
			[TRANSACTION_TYPE_EXPENSE]: existingTransaction.amount,
			[TRANSACTION_TYPE_INCOME]: -existingTransaction.amount,
		}[existingTransaction.type]
	}

	if (values.type === TRANSACTION_TYPE_EXPENSE && balance < amount) {
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

	await updateTransaction({
		db,
		transactionId,
		data: { ...values, amount },
	})

	return await redirectWithToast(`/app/transactions`, request, {
		type: 'success',
		title: t('form.edit.action.successToast'),
	})
}

export default function CreateTransaction({
	loaderData: { selectData, balances, initialData },
	actionData,
}: Route.ComponentProps) {
	return (
		<TransactionForm
			action={ACTION_EDITION}
			lastResult={actionData?.submission}
			selectData={selectData}
			balances={balances}
			initialData={initialData}
		/>
	)
}
