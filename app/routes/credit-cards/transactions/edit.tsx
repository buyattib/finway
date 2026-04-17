import type { Route } from './+types/edit'

import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import { ACTION_EDITION } from '~/lib/constants'
import { getSelectData } from '~/lib/queries'

import {
	getCreditCardTransactionById,
	getTransactionInstallmentCount,
} from '../lib/queries'
import { creditCardContext } from '../lib/context'

import { CreditCardTransactionForm } from './components/form'
import { creditCardTransactionAction } from '../lib/services'

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
	const t = getServerT(context, 'credit-cards')
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const {
		creditCard: { id, brand, last4 },
	} = context.get(creditCardContext)

	const transaction = await getCreditCardTransactionById({
		db,
		transactionId,
	})
	if (!transaction || transaction.creditCard.id !== id) {
		throw new Response(t('transaction.edit.loader.notFoundError'), {
			status: 404,
		})
	}

	const [selectData, totalInstallments] = await Promise.all([
		getSelectData(db, user.id),
		getTransactionInstallmentCount({ db, transactionId }),
	])

	return {
		creditCard: { brand: brand, last4: last4 },
		selectData,
		initialData: {
			id: transaction.id,
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
				brand,
				last4,
			}),
			description: t('transaction.edit.meta.description', {
				brand,
				last4,
			}),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	return await creditCardTransactionAction({
		request,
		context,
		action: ACTION_EDITION,
	})
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
