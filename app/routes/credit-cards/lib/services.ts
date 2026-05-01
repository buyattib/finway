import { data, type RouterContextProvider } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import { getServerT } from '~/utils-server/i18n.server'
import { redirectWithToast } from '~/utils-server/toast.server'
import { dbContext } from '~/lib/context'
import { getCurrencyById } from '~/lib/queries'
import type { TFormAction } from '~/lib/types'
import { ACTION_CREATION, ACTION_EDITION } from '~/lib/constants'

import { creditCardTransactionFormSchema } from './schemas'
import { creditCardContext } from './context'
import { STATEMENT_STATUS_PAID } from './constants'
import {
	createCreditCardTransaction,
	getCreditCardTransactionById,
	getStatementById,
	getStatementStatus,
	getStatementTotalsByCurrency,
	makeTransactionInstallments,
	updateCreditCardTransaction,
} from './queries'
import { reduceStatementTotals } from './utils'

export async function creditCardTransactionAction({
	request,
	context,
	action,
}: {
	request: Request
	context: Readonly<RouterContextProvider>
	action: TFormAction
}) {
	const t = getServerT(context, 'credit-cards')
	const db = context.get(dbContext)
	const { creditCard } = context.get(creditCardContext)

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: creditCardTransactionFormSchema(t),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== action) {
		const msg = {
			[ACTION_CREATION]: t(
				'transaction.create.action.invalidActionError',
			),
			[ACTION_EDITION]: t('transaction.edit.action.invalidActionError'),
		}[action]
		throw new Response(msg, {
			status: 422,
		})
	}

	if (submission.value.action === ACTION_EDITION) {
		const existingTransaction = await getCreditCardTransactionById({
			db,
			transactionId: submission.value.id,
		})
		if (
			!existingTransaction ||
			existingTransaction.accountId !== creditCard.accountId
		) {
			return data(
				{
					submission: submission.reply({
						formErrors: [
							t('transaction.edit.action.transactionNotFound'),
						],
					}),
				},
				{ status: 404 },
			)
		}
	}

	const currency = await getCurrencyById({
		db,
		currencyId: submission.value.currencyId,
	})
	if (!currency) {
		const msg = {
			[ACTION_CREATION]: t('transaction.create.action.currencyNotFound'),
			[ACTION_EDITION]: t('transaction.edit.action.currencyNotFound'),
		}[action]
		return data(
			{
				submission: submission.reply({
					fieldErrors: { currencyId: [msg] },
				}),
			},
			{ status: 422 },
		)
	}

	const amount = Number(submission.value.amount) * 100

	const installments = await makeTransactionInstallments({
		db,
		creditCardId: creditCard.id,
		amount,
		transactionDate: new Date(submission.value.date),
		installmentCount: Number(submission.value.totalInstallments),
	})

	let redirectUrl = `/app/credit-cards/${creditCard.id}`
	if (submission.value.action === ACTION_CREATION) {
		const {
			action: _action,
			totalInstallments: _totalInstallments,
			...values
		} = submission.value

		await createCreditCardTransaction({
			db,
			accountId: creditCard.accountId,
			transactionData: {
				...values,
				amount,
			},
			installments,
		})
	} else {
		const {
			action: _action,
			totalInstallments: _totalInstallments,
			id,
			...values
		} = submission.value
		redirectUrl = `/app/credit-cards/${creditCard.id}/transactions/${id}`

		await updateCreditCardTransaction({
			db,
			transactionId: id,
			transactionData: {
				...values,
				amount,
			},
			installments,
		})
	}

	const msg = {
		[ACTION_CREATION]: t('transaction.create.action.successToast'),
		[ACTION_EDITION]: t('transaction.edit.action.successToast'),
	}[action]

	return await redirectWithToast(redirectUrl, request, {
		type: 'success',
		title: msg,
	})
}

export async function validateStatementPayment({
	context,
	request,
	statementId,
}: {
	context: Readonly<RouterContextProvider>
	request: Request
	statementId: string
}) {
	const t = getServerT(context, 'credit-cards')
	const db = context.get(dbContext)
	const { creditCard } = context.get(creditCardContext)

	const statement = await getStatementById({ db, statementId })
	if (!statement || statement.creditCardId !== creditCard.id) {
		throw await redirectWithToast('..', request, {
			type: 'error',
			title: t('statement.payment.action.notFoundError'),
		})
	}

	const owed = reduceStatementTotals(
		await getStatementTotalsByCurrency({ db, statementId }),
	)
	const status = await getStatementStatus({ db, statementId, owed })

	if (status === STATEMENT_STATUS_PAID) {
		throw await redirectWithToast('..', request, {
			type: 'error',
			title: t('statement.payment.action.alreadyPaidError'),
		})
	}

	const payments = owed.filter(o => o.amountCents > 0)
	if (payments.length === 0) {
		throw await redirectWithToast('..', request, {
			type: 'error',
			title: t('statement.payment.action.nothingOwedError'),
		})
	}

	return { statement, payments }
}
