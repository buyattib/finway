import { useState } from 'react'
import { Link } from 'react-router'
import {
	BanknoteArrowDownIcon,
	BanknoteArrowUpIcon,
	ChartPieIcon,
	PlusIcon,
	WalletIcon,
} from 'lucide-react'
import { Pie, PieChart } from 'recharts'
import type { Route } from './+types'

import { dbContext, userContext } from '~/lib/context'
import { formatNumber } from '~/lib/utils'

import { type ChartConfig, ChartContainer } from '~/components/ui/chart'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Text } from '~/components/ui/text'
import { CurrencyIcon } from '~/components/currency-icon'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'

import { getBalances } from '~/routes/accounts/lib/queries'
import { CURRENCY_DISPLAY } from '~/routes/accounts/lib/constants'
import type { TCurrency } from '~/routes/accounts/lib/types'

import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
} from '~/routes/transactions/lib/constants'

import { getMonthTransactions } from './lib/queries'
import type { CategoryResponse, CurrencyResponse } from './lib/types'

const colorPalette = [
	'#8884d8',
	'#82ca9d',
	'#ffc658',
	'#ff7c7c',
	'#8dd1e1',
	'#d084d0',
	'#ffb347',
	'#87ceeb',
	'#dda0dd',
	'#98fb98',
	'#f0e68c',
	'#ff6347',
	'#40e0d0',
	'#ee82ee',
	'#90ee90',
	'#ffd700',
	'#ff69b4',
	'#00ced1',
	'#ffa500',
	'#9370db',
]

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
		).map(({ currency, currencyId, balance }) => ({
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

	const categoryExpensesByCurrency = (
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

	return { summary, categoryExpensesByCurrency }
}

export default function Dashboard({
	loaderData: { summary, categoryExpensesByCurrency },
}: Route.ComponentProps) {
	const cards = [
		{
			title: 'Total balances',
			icon: <WalletIcon />,
			data: summary.balances,
			empty: 'No balances',
		},
		{
			title: 'This month expenses',
			icon: <BanknoteArrowDownIcon />,
			data: summary.monthExpenses,
			empty: 'No expenses',
		},
		{
			title: 'This month incomes',
			icon: <BanknoteArrowUpIcon />,
			data: summary.monthIncomes,
			empty: 'No incomes',
		},
	]

	const expensesCurrencies = Object.keys(
		categoryExpensesByCurrency,
	) as Array<TCurrency>
	const [expensesCurrency, setExpensesCurrency] = useState<TCurrency>(
		expensesCurrencies[0],
	)

	const expensesByCategoryContent = () => {
		if (expensesCurrencies.length === 0) {
			return (
				<div className='flex items-center justify-center'>
					<div className='flex flex-col items-center gap-2'>
						<ChartPieIcon className='text-muted-foreground w-10 h-10' />
						<Text size='sm' theme='muted'>
							No expenses
						</Text>
						<div className='flex items-center gap-4'>
							<Button asChild variant='outline'>
								<Link to='/accounts'>
									<PlusIcon />
									Create Account
								</Link>
							</Button>
							<Button asChild variant='default'>
								<Link to='/transactions'>
									<PlusIcon />
									Create Transaction
								</Link>
							</Button>
						</div>
					</div>
				</div>
			)
		}

		const expenses = categoryExpensesByCurrency[expensesCurrency]
		const config = Object.fromEntries(
			expenses.map(expense => {
				return [
					expense.transactionCategory,
					{ label: expense.transactionCategory },
				]
			}),
		) satisfies ChartConfig

		const data = expenses.map((expense, i) => {
			return {
				transactionCategory: expense.transactionCategory,
				amount: Number(expense.amount),
				fill: colorPalette[i % colorPalette.length],
			}
		})

		const total =
			Number(
				summary.monthExpenses.find(
					item => item.currency === expensesCurrency,
				)?.amount,
			) ?? 0

		return (
			<ChartContainer config={config} className='w-full sm:max-h-80'>
				<PieChart>
					<Pie
						data={data}
						dataKey='amount'
						nameKey='category'
						labelLine={false}
						label={({ payload, ...props }) => {
							const perc =
								window.Math.round(
									10 * 100 * (payload.amount / total),
								) / 10

							const label = `${payload.transactionCategory}: ${CURRENCY_DISPLAY[expensesCurrency].symbol} ${formatNumber(payload.amount)} (%${perc})`
							return (
								<text
									cx={props.cx}
									cy={props.cy}
									x={props.x}
									y={props.y}
									textAnchor={props.textAnchor}
									dominantBaseline={props.dominantBaseline}
									fill={payload.fill}
								>
									{label}
								</text>
							)
						}}
					/>
				</PieChart>
			</ChartContainer>
		)
	}

	return (
		<section className='space-y-8'>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
				{cards.map(({ title, icon, data, empty }) => (
					<Card key={title}>
						<CardHeader className='flex items-center justify-between'>
							<CardTitle>{title}</CardTitle>
							{icon}
						</CardHeader>
						<CardContent>
							{data.length === 0 && (
								<Text alignment='center' className='italic'>
									{empty}
								</Text>
							)}
							<ul className='flex flex-col gap-2'>
								{data.map(
									({ currencyId, currency, amount }) => (
										<li
											key={currencyId}
											className='flex items-center justify-between gap-2'
										>
											<Text className='flex items-center gap-2'>
												<CurrencyIcon
													currency={currency}
													size='sm'
												/>
												{currency}
											</Text>
											<Text>
												{
													CURRENCY_DISPLAY[currency]
														.symbol
												}{' '}
												{formatNumber(amount)}
											</Text>
										</li>
									),
								)}
							</ul>
						</CardContent>
					</Card>
				))}
			</div>

			<Card className='flex flex-col'>
				<CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
					<CardTitle>Expenses by category</CardTitle>
					{expensesCurrencies.length !== 0 && (
						<Select
							value={expensesCurrency}
							onValueChange={(c: TCurrency) =>
								setExpensesCurrency(c)
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{expensesCurrencies.map(currency => (
									<SelectItem key={currency} value={currency}>
										<CurrencyIcon currency={currency} />{' '}
										{currency}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</CardHeader>
				<CardContent>{expensesByCategoryContent()}</CardContent>
			</Card>
		</section>
	)
}
