import { Link } from 'react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, CartesianGrid, XAxis, Bar, LabelList } from 'recharts'
import { ChartColumnIcon, PlusIcon } from 'lucide-react'

import type { Route } from '../+types'

import { formatNumber, formatDate } from '~/lib/utils'
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

type Props = Pick<Route.ComponentProps['loaderData'], 'expensesByMonth'>

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

export function ExpensesByMonth({ expensesByMonth }: Props) {
	const { t } = useTranslation('dashboard')
	const currencies = Object.keys(expensesByMonth) as Array<TCurrency>

	const [selectedCurrency, setSelectedCurrency] = useState<TCurrency>(
		currencies[0],
	)

	const currencySymbol = getCurrencySymbol(selectedCurrency)

	if (currencies.length === 0) {
		return (
			<Layout title={t('index.expensesByMonth.title')}>
				<div className='flex items-center justify-center'>
					<div className='flex flex-col items-center gap-2'>
						<ChartColumnIcon className='text-muted-foreground w-10 h-10' />
						<Text size='sm' theme='muted'>
							{t('index.expensesByMonth.noExpenses')}
						</Text>
						<div className='flex items-center gap-4'>
							<Button asChild variant='outline'>
								<Link to='/accounts'>
									<PlusIcon />
									{t('index.expensesByMonth.createAccount')}
								</Link>
							</Button>
							<Button asChild variant='default'>
								<Link to='/transactions'>
									<PlusIcon />
									{t(
										'index.expensesByMonth.createTransaction',
									)}
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</Layout>
		)
	}

	const config = {} satisfies ChartConfig

	const expenseData = expensesByMonth[selectedCurrency]
	const expenseMap = new Map(
		expenseData.map(exp => [`${exp.year}-${exp.month}`, exp.amount]),
	)

	const now = new Date()
	const data = Array.from({ length: 12 }, (_, i) => {
		const date = new Date(now.getFullYear(), now.getMonth() - 11 + i)
		const key = `${date.getFullYear()}-${date.getMonth() + 1}`
		const dateString = formatDate(date, { day: undefined, month: 'short' })
		return {
			date: dateString,
			amount: expenseMap.get(key) ?? '0',
		}
	})

	return (
		<Layout
			title={t('index.expensesByMonth.title')}
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
			<ChartContainer config={config} className='aspect-auto h-80 w-full [&_svg]:overflow-visible'>
				<BarChart
					accessibilityLayer
					data={data}
					margin={{
						top: 30,
						right: 50,
					}}
				>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey='date'
						tickLine={false}
						axisLine={false}
						tickMargin={10}
						interval={0}
						angle={-45}
						textAnchor='end'
						height={70}
						dy={5}
						padding={{ right: 20 }}
					/>
					<Bar
						dataKey='amount'
						fill='var(--color-danger)'
						radius={6}
					>
						<LabelList
							position='top'
							offset={6}
							fontSize={12}
							className='font-semibold whitespace-nowrap'
							formatter={amount =>
								Number(amount) === 0
									? ''
									: `${currencySymbol}${formatNumber(String(amount))}`
							}
						/>
					</Bar>
				</BarChart>
			</ChartContainer>
		</Layout>
	)
}
