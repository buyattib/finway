import type { Route } from './+types'

import { dbContext, userContext } from '~/lib/context'

import { getBalances } from '~/lib/queries'
import type { TCurrency } from '~/lib/types'
import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
} from '~/lib/constants'

import {
	getMonthTransactions,
	getMonthCreditCardTotals,
	getMonthInstallments,
} from './lib/queries'
import type {
	CategoryResponse,
	CurrencyResponse,
	MonthResponse,
} from './lib/types'

import { SummaryCards } from './components/summary-cards'
import { ExpensesByCategory } from './components/expenses-by-category'
import { ExpensesByMonth } from './components/expenses-by-month'
import { MonthInstallments } from './components/month-installments'

export function meta() {
	return [
		{ title: 'Dashboard | Finway' },

		{
			property: 'og:title',
			content: 'Dashboard | Finway',
		},
		{
			name: 'description',
			content: 'Your financial dashboard',
		},
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

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
		monthCreditCardTotals: await getMonthCreditCardTotals({
			db,
			ownerId: user.id,
		}),
	}

	const monthInstallments = await getMonthInstallments({
		db,
		ownerId: user.id,
	})

	const expensesByCategory = (
		await getMonthTransactions({
			db,
			ownerId: user.id,
			transactionType: TRANSACTION_TYPE_EXPENSE,
			group: 'category',
		})
	).reduce(
		(acc, curr) => {
			acc[curr.currency] = acc[curr.currency] || []
			acc[curr.currency].push({
				transactionCategoryId: curr.transactionCategoryId,
				transactionCategory: curr.transactionCategory,
				amount: curr.amount,
			})
			return acc
		},
		{} as Record<
			TCurrency,
			Array<CategoryResponse & Pick<CurrencyResponse, 'amount'>>
		>,
	)

	const expensesByMonth = (
		await getMonthTransactions({
			db,
			ownerId: user.id,
			transactionType: TRANSACTION_TYPE_EXPENSE,
			group: 'month',
		})
	).reduce(
		(acc, curr) => {
			acc[curr.currency] = acc[curr.currency] || []
			acc[curr.currency].push({
				month: curr.month,
				year: curr.year,
				amount: curr.amount,
			})
			return acc
		},
		{} as Record<
			TCurrency,
			Array<MonthResponse & Pick<CurrencyResponse, 'amount'>>
		>,
	)

	return {
		summary,
		expensesByCategory,
		expensesByMonth,
		monthInstallments,
	}
}

export default function Dashboard({
	loaderData: {
		summary,
		expensesByCategory,
		expensesByMonth,
		monthInstallments,
	},
}: Route.ComponentProps) {
	return (
		<section className='space-y-8'>
			<SummaryCards summary={summary} />
			<ExpensesByCategory
				expensesByCategory={expensesByCategory}
				monthExpenses={summary.monthExpenses}
			/>
			<ExpensesByMonth expensesByMonth={expensesByMonth} />
			<MonthInstallments monthInstallments={monthInstallments} />
		</section>
	)
}
