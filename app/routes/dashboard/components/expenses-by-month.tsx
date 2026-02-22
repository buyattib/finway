import { Link } from 'react-router'
import { useState } from 'react'
import { BarChart, CartesianGrid, XAxis, Bar, LabelList } from 'recharts'
import { ChartColumnIcon, PlusIcon } from 'lucide-react'
import type { Route } from '../+types'

import { formatNumber, formatDate } from '~/lib/utils'

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

import type { TCurrency } from '~/lib/types'
import { getCurrencyData } from '~/lib/utils'

type Props = Pick<Route.ComponentProps['loaderData'], 'expensesByMonth'>

function Layout({
	children,
	select,
}: {
	children: React.ReactNode
	select?: React.ReactNode
}) {
	return (
		<Card className='flex flex-col'>
			<CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
				<CardTitle>Expenses a year back</CardTitle>
				{!!select && select}
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	)
}

export function ExpensesByMonth({ expensesByMonth }: Props) {
	const currencies = Object.keys(expensesByMonth) as Array<TCurrency>

	const [selectedCurrency, setSelectedCurrency] = useState<TCurrency>(
		currencies[0],
	)

	const currencyData = getCurrencyData(selectedCurrency)

	if (currencies.length === 0) {
		return (
			<Layout>
				<div className='flex items-center justify-center'>
					<div className='flex flex-col items-center gap-2'>
						<ChartColumnIcon className='text-muted-foreground w-10 h-10' />
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
			</Layout>
		)
	}

	const config = {} satisfies ChartConfig
	const data = expensesByMonth[selectedCurrency].map(exp => {
		const date = new Date(exp.year, exp.month - 1)
		const dateString = formatDate(date, { day: undefined, month: 'long' })
		return {
			date: dateString,
			amount: exp.amount,
		}
	})

	return (
		<Layout
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
			<ChartContainer config={config} className='aspect-auto h-80 w-full'>
				<BarChart
					accessibilityLayer
					data={data}
					margin={{
						top: 20,
					}}
				>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey='date'
						tickLine={false}
						axisLine={false}
						tickMargin={10}
					/>
					<Bar
						dataKey='amount'
						fill='var(--color-blue)'
						radius={6}
						maxBarSize={100}
					>
						<LabelList
							position='top'
							offset={6}
							fontSize={14}
							className='font-semibold'
							formatter={(amount: string) =>
								`${currencyData.symbol} ${formatNumber(amount)}`
							}
						/>
					</Bar>
				</BarChart>
			</ChartContainer>
		</Layout>
	)
}
