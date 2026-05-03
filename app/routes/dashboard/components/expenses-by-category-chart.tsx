import { useState } from 'react'
import { useFetcher } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { DateRange } from 'react-day-picker'

import type { loader } from '../resources/expenses-by-category'

import type { TCurrency } from '~/lib/types'
import { formatDate, formatNumber, getCurrencySymbol } from '~/lib/utils'

import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Text } from '~/components/ui/text'
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from '~/components/ui/chart'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { CurrencyIcon } from '~/components/currency-icon'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/components/ui/popover'
import { Button } from '~/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '~/components/ui/calendar'

const chartConfig = {
	amount: {
		label: 'Amount',
		color: 'var(--chart-1)',
	},
} satisfies ChartConfig

type ChartData = Awaited<ReturnType<typeof loader>>

type CurrencyOption = {
	currencyId: string
	currency: TCurrency
}

export function ExpensesByCategoryChart({
	currencies,
	initialData,
	initialDateRange,
}: {
	currencies: CurrencyOption[]
	initialData: ChartData
	initialDateRange: { from: string; to: string }
}) {
	const { t, i18n } = useTranslation(['dashboard', 'constants'])
	const fetcher = useFetcher<typeof loader>()

	const currencyOptions = currencies.map(({ currencyId, currency }) => ({
		value: currencyId,
		label: currency,
		icon: <CurrencyIcon currency={currency} size='sm' />,
	}))

	const [selectedDate, setSelectedDate] = useState<DateRange | undefined>({
		from: new Date(initialDateRange.from),
		to: new Date(initialDateRange.to),
	})
	const [selectedCurrency, setSelectedCurrency] = useState<string>(
		currencyOptions[0]?.value,
	)
	const selectedCode = currencies.find(
		c => c.currencyId === selectedCurrency,
	)?.currency
	const symbol = selectedCode ? getCurrencySymbol(selectedCode) : undefined

	if (!selectedCurrency || !symbol) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t('index.expensesByCategory.title')}</CardTitle>
				</CardHeader>
				<CardContent>
					<Text alignment='center' className='italic'>
						{t('index.expensesByCategory.empty')}
					</Text>
				</CardContent>
			</Card>
		)
	}

	const handleCurrencyChange = (currencyId: string) => {
		setSelectedCurrency(currencyId)
		fetcher.load(
			`/app/dashboard/expenses-by-category?currencyId=${currencyId}`,
		)
	}

	const chartData = (fetcher.data ?? initialData).map(row => ({
		category: row.category,
		label: t(`constants:categories.${row.category}.name`),
		amount: Number(row.amount),
	}))

	return (
		<Card>
			<CardHeader className='flex flex-col md:flex-row md:items-center md:justify-between gap-2'>
				<CardTitle>{t('index.expensesByCategory.title')}</CardTitle>

				<div className='flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:w-fit w-full'>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant='outline'
								id='date-picker-range'
								className='justify-start px-2.5 font-normal'
							>
								<CalendarIcon />
								{selectedDate?.from ? (
									selectedDate.to ? (
										<>
											{formatDate(
												selectedDate.from,
												i18n.language,
											)}{' '}
											-{' '}
											{formatDate(
												selectedDate.to,
												i18n.language,
											)}
										</>
									) : (
										formatDate(
											selectedDate.from,
											i18n.language,
										)
									)
								) : (
									<span>Pick a date</span>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className='w-auto p-0' align='start'>
							<Calendar
								mode='range'
								defaultMonth={selectedDate?.from}
								selected={selectedDate}
								onSelect={setSelectedDate}
								numberOfMonths={2}
							/>
						</PopoverContent>
					</Popover>

					<Select
						value={selectedCurrency}
						onValueChange={handleCurrencyChange}
					>
						<SelectTrigger className='md:w-fit w-full'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{currencyOptions.map(({ value, label, icon }) => (
								<SelectItem key={value} value={value}>
									{icon} {label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
			<CardContent>
				<ChartContainer
					config={chartConfig}
					className='min-h-80 w-full'
				>
					<BarChart
						accessibilityLayer
						data={chartData}
						layout='vertical'
						margin={{ left: 16, right: 16 }}
					>
						<CartesianGrid horizontal={false} />
						<XAxis
							type='number'
							tickFormatter={value =>
								`${symbol} ${formatNumber(
									value,
									i18n.language,
									{
										minimumFractionDigits: 0,
										maximumFractionDigits: 0,
									},
								)}`
							}
						/>
						<YAxis
							type='category'
							dataKey='label'
							width={80}
							tickLine={false}
							axisLine={false}
						/>
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									formatter={value => (
										<span className='font-mono font-medium tabular-nums'>
											{symbol}{' '}
											{formatNumber(
												value as number,
												i18n.language,
											)}
										</span>
									)}
								/>
							}
						/>
						<Bar
							dataKey='amount'
							fill='var(--color-amount)'
							radius={4}
							maxBarSize={32}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}
