import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'
import type { Route } from './+types/create'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import { ACTION_CREATION } from '~/lib/constants'
import { getSelectData, getCurrencyById } from '~/lib/queries'

import { TRANSACTION_CATEGORIES } from '~/routes/transactions/lib/constants'

import {
	getStatementByDate,
	getStatementsFromDate,
	createCreditCardTransaction,
	ensureStatementsExist,
} from '../lib/queries'
import { createCreditCardTransactionFormSchema } from '../lib/schemas'
import { CC_TRANSACTION_TYPE_CHARGE } from '../lib/constants'
import { creditCardContext } from '../lib/context'

import { CreditCardTransactionForm, type TInitialData } from './components/form'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const creditCard = context.get(creditCardContext)
	const t = getServerT(context, 'credit-cards')

	const selectData = await getSelectData(db, user.id)

	return {
		creditCard: { brand: creditCard.brand, last4: creditCard.last4 },
		selectData,
		initialData: {
			creditCardId: creditCard.id,
			type: CC_TRANSACTION_TYPE_CHARGE,
			amount: '0',
			totalInstallments: '1',
			description: '',
			currencyId: selectData.currencies?.[0]?.id || '',
			category: TRANSACTION_CATEGORIES[0],
		} satisfies Partial<TInitialData>,
		meta: {
			title: t('transaction.create.meta.title'),
			description: t('transaction.create.meta.description'),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const db = context.get(dbContext)
	const creditCard = context.get(creditCardContext)
	const t = getServerT(context, 'credit-cards')

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: createCreditCardTransactionFormSchema(t),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_CREATION) {
		throw new Response(t('transaction.create.action.invalidActionError'), {
			status: 422,
		})
	}

	const {
		action: _action,
		creditCardId: _submittedCreditCardId,
		totalInstallments,
		...values
	} = submission.value

	const amount = Number(values.amount) * 100

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
							t('transaction.create.action.currencyNotFound'),
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

	await createCreditCardTransaction({
		db,
		transactionData: {
			...values,
			amount,
			description: values.description ?? '',
		},
		creditCardId: creditCard.id,
		installments: statements.map((statement, i) => ({
			installmentNumber: i + 1,
			amount: baseAmount + (i < remainder ? 1 : 0),
			statementId: statement.id,
		})),
	})

	return await redirectWithToast(
		`/app/credit-cards/${creditCard.id}`,
		request,
		{
			type: 'success',
			title: t('transaction.create.action.successToast'),
		},
	)
}

export default function CreateCreditCardTransaction({
	loaderData: { creditCard, initialData, selectData },
	actionData,
}: Route.ComponentProps) {
	return (
		<CreditCardTransactionForm
			action={ACTION_CREATION}
			creditCard={creditCard}
			selectData={selectData}
			initialData={initialData}
			lastResult={actionData?.submission}
		/>
	)
}
