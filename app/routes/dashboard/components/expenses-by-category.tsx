import { Link } from 'react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pie, PieChart } from 'recharts'
import { ChartPieIcon, PlusIcon } from 'lucide-react'

import type { Route } from '../+types'

import { formatNumber } from '~/lib/utils'
import type { TCurrency } from '~/lib/types'
import { getCurrencySymbol } from '~/lib/utils'

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

type LoaderData = Route.ComponentProps['loaderData']
type Props = Pick<LoaderData, 'expensesByCategory'> &
	Pick<LoaderData['summary'], 'monthExpenses'>

function Layout({
	children,
	select,
	title,
}: {
	children: React.ReactNode
	select?: React.ReactNode
	title: string
}) {
	return (
		<Card className='flex flex-col'>
			<CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
				<CardTitle>{title}</CardTitle>
				{!!select && select}
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	)
}

export function ExpensesByCategory({
	expensesByCategory,
	monthExpenses,
}: Props) {
	const { t } = useTranslation('dashboard')
	const currencies = Object.keys(expensesByCategory) as Array<TCurrency>

	const [selectedCurrency, setSelectedCurrency] = useState<TCurrency>(
		currencies[0],
	)

	if (currencies.length === 0) {
		return (
			<Layout title={t('index.expensesByCategory.title')}>
				<div className='flex items-center justify-center'>
					<div className='flex flex-col items-center gap-2'>
						<ChartPieIcon className='text-muted-foreground w-10 h-10' />
						<Text size='sm' theme='muted'>
							{t('index.expensesByCategory.noExpenses')}
						</Text>
						<div className='flex items-center gap-4'>
							<Button asChild variant='outline'>
								<Link to='/app/accounts'>
									<PlusIcon />
									{t(
										'index.expensesByCategory.createAccount',
									)}
								</Link>
							</Button>
							<Button asChild variant='default'>
								<Link to='/app/transactions'>
									<PlusIcon />
									{t(
										'index.expensesByCategory.createTransaction',
									)}
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</Layout>
		)
	}

	const expenses = expensesByCategory[selectedCurrency]
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
			monthExpenses.find(item => item.currency === selectedCurrency)
				?.amount,
		) || 0

	return (
		<Layout
			title={t('index.expensesByCategory.title')}
			select={
				<Select
					value={selectedCurrency}
					onValueChange={(c: TCurrency) => setSelectedCurrency(c)}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{currencies.map(currency => (
							<SelectItem key={currency} value={currency}>
								<CurrencyIcon currency={currency} /> {currency}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			}
		>
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

							const symbol = getCurrencySymbol(selectedCurrency)
							const label = `${payload.transactionCategory}: ${symbol} ${formatNumber(payload.amount)} (%${perc})`
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
		</Layout>
	)
}
