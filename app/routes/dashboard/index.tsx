import type { Route } from './+types'

import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { getBalances } from '~/lib/queries'
import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
} from '~/features/transactions/constants'

import { PageSection } from '~/components/ui/page'

import {
	getMonthlyCreditCardExpenses,
	getMonthTransactions,
	getMonthTransactionsByCategory,
} from './lib/queries'
import { SummaryCards } from './components/summary-cards'
import { ExpensesByCategoryChart } from './components/expenses-by-category-chart'
import { MonthlyCreditCardExpensesChart } from './components/monthly-credit-card-expenses-chart'

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
	const monthExpensesByCategory = await getMonthTransactionsByCategory({
		db,
		ownerId: user.id,
		transactionType: TRANSACTION_TYPE_EXPENSE,
	})

	const monthlyCreditCardExpenses = await getMonthlyCreditCardExpenses({
		db,
		ownerId: user.id,
	})

	return {
		meta: {
			title: t('index.meta.title'),
			description: t('index.meta.description'),
		},
		summary,
		monthExpensesByCategory,
		monthlyCreditCardExpenses,
	}
}

export default function Dashboard({
	loaderData: { summary, monthExpensesByCategory, monthlyCreditCardExpenses },
}: Route.ComponentProps) {
	return (
		<PageSection>
			<SummaryCards summary={summary} />
			<ExpensesByCategoryChart data={monthExpensesByCategory} />
			<MonthlyCreditCardExpensesChart data={monthlyCreditCardExpenses} />
		</PageSection>
	)
}
