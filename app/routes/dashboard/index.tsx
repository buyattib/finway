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
	getCreditCardExpenseCurrencies,
	getMonthlyCreditCardExpenses,
	getMonthTransactions,
	getMonthTransactionCurrencies,
	getMonthTransactionsByCategory,
} from './lib/queries'
import { getMonthRange } from './lib/utils'
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

	const { monthStart, monthEnd } = getMonthRange()
	const [from, to] = [monthStart.toISOString(), monthEnd.toISOString()]

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
			from,
			to,
		}),
		monthIncomes: await getMonthTransactions({
			db,
			ownerId: user.id,
			transactionType: TRANSACTION_TYPE_INCOME,
			group: 'currency',
			from,
			to,
		}),
		creditCardDebt: (
			await getBalances({
				db,
				ownerId: user.id,
				group: 'currency',
				accountKind: 'cc',
			})
		)
			.filter(({ balance }) => Number(balance) < 0)
			.map(({ currency, currencyId, balance }) => ({
				currencyId,
				currency,
				amount: (-Number(balance)).toString(),
			})),
	}

	const [txCurrencies, ccCurrencies] = await Promise.all([
		getMonthTransactionCurrencies({
			db,
			ownerId: user.id,
			transactionType: TRANSACTION_TYPE_EXPENSE,
			from,
			to,
		}),
		getCreditCardExpenseCurrencies({
			db,
			ownerId: user.id,
		}),
	])

	const [monthExpensesByCategory, monthlyCreditCardExpenses] =
		await Promise.all([
			getMonthTransactionsByCategory({
				db,
				ownerId: user.id,
				transactionType: TRANSACTION_TYPE_EXPENSE,
				currencyId: txCurrencies?.[0]?.currencyId,
				from,
				to,
			}),
			getMonthlyCreditCardExpenses({
				db,
				ownerId: user.id,
				currencyId: ccCurrencies?.[0]?.currencyId,
			}),
		])

	return {
		meta: {
			title: t('index.meta.title'),
			description: t('index.meta.description'),
		},
		summary,
		expenseByCategoryChart: {
			currencies: txCurrencies,
			data: monthExpensesByCategory,
			dateRange: { from, to },
		},
		ccExpensesChart: {
			currencies: ccCurrencies,
			data: monthlyCreditCardExpenses,
		},
	}
}

export default function Dashboard({
	loaderData: { summary, expenseByCategoryChart, ccExpensesChart },
}: Route.ComponentProps) {
	return (
		<PageSection>
			<SummaryCards summary={summary} />
			<ExpensesByCategoryChart initialData={expenseByCategoryChart} />
			<MonthlyCreditCardExpensesChart
				currencies={ccExpensesChart.currencies}
				initialData={ccExpensesChart.data}
			/>
		</PageSection>
	)
}
