import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types/edit'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import { ACTION_EDITION } from '~/lib/constants'
import { getSelectData, getCurrencyById } from '~/lib/queries'

import {
	getCreditCardTransactionById,
	getTransactionInstallmentCount,
	getStatementByDate,
	getStatementsFromDate,
	ensureStatementsExist,
	updateCreditCardTransaction,
} from '../lib/queries'
import { creditCardTransactionFormSchema } from '../lib/schemas'
import { creditCardContext } from '../lib/context'

import { CreditCardTransactionForm } from './components/form'

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
	const { creditCard } = context.get(creditCardContext)
	const t = getServerT(context, 'credit-cards')

	const transaction = await getCreditCardTransactionById({
		db,
		transactionId,
	})
	if (!transaction || transaction.creditCard.id !== creditCard.id) {
		throw new Response(t('transaction.edit.loader.notFoundError'), {
			status: 404,
		})
	}

	const [selectData, totalInstallments] = await Promise.all([
		getSelectData(db, user.id),
		getTransactionInstallmentCount({ db, transactionId }),
	])

	return {
		creditCard: { brand: creditCard.brand, last4: creditCard.last4 },
		selectData,
		initialData: {
			id: transaction.id,
			creditCardId: creditCard.id,
			date: transaction.date,
			type: transaction.type,
			amount: String(transaction.amount / 100),
			totalInstallments: String(totalInstallments),
			description: transaction.description ?? '',
			currencyId: transaction.currencyId,
			category: transaction.category,
		},
		meta: {
			title: t('transaction.edit.meta.title', {
				brand: creditCard.brand,
				last4: creditCard.last4,
			}),
			description: t('transaction.edit.meta.description', {
				brand: creditCard.brand,
				last4: creditCard.last4,
			}),
		},
	}
}

export async function action({
	request,
	context,
	params: { transactionId },
}: Route.ActionArgs) {
	const db = context.get(dbContext)
	const creditCard = context.get(creditCardContext)
	const t = getServerT(context, 'credit-cards')

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: creditCardTransactionFormSchema(t),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_EDITION) {
		throw new Response(t('transaction.edit.action.invalidActionError'), {
			status: 422,
		})
	}

	const {
		action: _action,
		id: _id,
		creditCardId: _creditCardId,
		totalInstallments,
		...values
	} = submission.value

	const amount = Number(values.amount) * 100

	const existingTransaction = await getCreditCardTransactionById({
		db,
		transactionId,
	})
	if (
		!existingTransaction ||
		existingTransaction.creditCard.id !== creditCard.id
	) {
		return data(
			{
				submission: submission.reply({
					formErrors: [
						t('transaction.edit.action.transactionNotFound'),
					],
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
						currencyId: [
							t('transaction.edit.action.currencyNotFound'),
						],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const transactionDate = new Date(values.date)
	const installmentCount = Number(totalInstallments)

	await ensureStatementsExist({
		db,
		creditCardId: creditCard.id,
		date: transactionDate,
	})

	const transactionStatement = await getStatementByDate({
		db,
		creditCardId: creditCard.id,
		date: transactionDate,
	})
	if (!transactionStatement) {
		throw new Error('Could not find statement for date')
	}

	const lastInstallmentDate = new Date(transactionStatement.closingDate)
	lastInstallmentDate.setMonth(
		lastInstallmentDate.getMonth() + installmentCount - 1,
	)
	await ensureStatementsExist({
		db,
		creditCardId: creditCard.id,
		date: lastInstallmentDate,
	})

	const statements = await getStatementsFromDate({
		db,
		creditCardId: creditCard.id,
		date: transactionStatement.closingDate,
		limit: installmentCount,
	})

	if (statements.length < installmentCount) {
		throw new Error(
			`Expected ${installmentCount} statements but found ${statements.length}`,
		)
	}

	const baseAmount = Math.floor(amount / installmentCount)
	const remainder = amount - baseAmount * installmentCount

	await updateCreditCardTransaction({
		db,
		creditCardTransactionId: transactionId,
		transactionData: {
			...values,
			amount,
			description: values.description ?? '',
		},
		installments: statements.map((statement, i) => ({
			installmentNumber: i + 1,
			amount: baseAmount + (i < remainder ? 1 : 0),
			statementId: statement.id,
		})),
	})

	return await redirectWithToast(
		`/app/credit-cards/${creditCard.id}/transactions/${transactionId}`,
		request,
		{
			type: 'success',
			title: t('transaction.edit.action.successToast'),
		},
	)
}

export default function EditCreditCardTransaction({
	loaderData: { creditCard, initialData, selectData },
	actionData,
}: Route.ComponentProps) {
	return (
		<CreditCardTransactionForm
			action={ACTION_EDITION}
			creditCard={creditCard}
			selectData={selectData}
			initialData={initialData}
			lastResult={actionData?.submission}
		/>
	)
}
