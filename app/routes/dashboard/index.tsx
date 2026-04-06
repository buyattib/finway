import type { Route } from './+types'

import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { getBalances } from '~/lib/queries'
import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
} from '~/routes/transactions/lib/constants'

import { PageSection } from '~/components/ui/page'

import { getMonthTransactions } from './lib/queries'
import { SummaryCards } from './components/summary-cards'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)
	const t = getServerT(context, 'dashboard')

	const summary = {
		balances: (
			await getBalances({
				db,
				ownerId: user.id,
				group: 'currency',
			})
		)
			.filter(({ balance }) => Number(balance) > 0)
			.map(({ currency, currencyId, balance }) => ({
				currencyId,
				currency,
				amount: balance,
			})),
		monthExpenses: await getMonthTransactions({
			db,
			ownerId: user.id,
			transactionType: TRANSACTION_TYPE_EXPENSE,
			group: 'currency',
		}),
		monthIncomes: await getMonthTransactions({
			db,
			ownerId: user.id,
			transactionType: TRANSACTION_TYPE_INCOME,
			group: 'currency',
		}),
	}

	return {
		meta: {
			title: t('index.meta.title'),
			description: t('index.meta.description'),
		},
		summary,
	}
}

export default function Dashboard({
	loaderData: { summary },
}: Route.ComponentProps) {
	return (
		<PageSection>
			<SummaryCards summary={summary} />
		</PageSection>
	)
}
