import type { Route } from './+types/create'

import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import { ACTION_CREATION } from '~/lib/constants'
import { getSelectData } from '~/lib/queries'

import { TRANSACTION_CATEGORIES } from '~/routes/transactions/lib/constants'

import { CC_TRANSACTION_TYPE_CHARGE } from '../lib/constants'
import { creditCardContext } from '../lib/context'
import { creditCardTransactionAction } from '../lib/services'
import { CreditCardTransactionForm, type TInitialData } from './components/form'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const t = getServerT(context, 'credit-cards')
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const {
		creditCard: { brand, last4 },
	} = context.get(creditCardContext)

	const selectData = await getSelectData(db, user.id)

	return {
		creditCard: { brand: brand, last4: last4 },
		selectData,
		initialData: {
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
	return await creditCardTransactionAction({
		request,
		context,
		action: ACTION_CREATION,
	})
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
