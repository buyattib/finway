import { useState } from 'react'
import { useFetcher } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import type { loader } from '../resources/monthly-cc-expenses'

import type { TCurrency } from '~/lib/types'
import {
	formatDate,
	formatNumber,
	getCurrencySymbol,
	initializeDate,
} from '~/lib/utils'

import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Text } from '~/components/ui/text'
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from '~/components/ui/chart'
import { Select } from '~/components/select'
import { CurrencyIcon } from '~/components/currency-icon'

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

function toChartRows(data: ChartData, language: string) {
	return data.map(row => {
		const date = initializeDate({
			year: Number(row.year),
			month: Number(row.month) - 1,
			day: 1,
		})
		return {
			key: `${row.year}-${row.month}`,
			label: formatDate(date, language, {
				day: undefined,
				month: 'short',
			}),
			amount: Number(row.amount),
		}
	})
}

export function MonthlyCreditCardExpensesChart({
	currencies,
	initialData,
}: {
	currencies: CurrencyOption[]
	initialData: ChartData
}) {
	const { t, i18n } = useTranslation('dashboard')
	const fetcher = useFetcher<typeof loader>()

	const currencyOptions = currencies.map(({ currencyId, currency }) => ({
		value: currencyId,
		label: currency,
		icon: <CurrencyIcon currency={currency} size='sm' />,
	}))

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
					<CardTitle>
						{t('index.monthlyCreditCardExpenses.title')}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Text alignment='center' className='italic'>
						{t('index.monthlyCreditCardExpenses.empty')}
					</Text>
				</CardContent>
			</Card>
		)
	}

	const handleCurrencyChange = (currencyId: string) => {
		setSelectedCurrency(currencyId)
		fetcher.load(
			`/app/dashboard/monthly-cc-expenses?currencyId=${currencyId}`,
		)
	}

	const chartData = toChartRows(fetcher.data ?? initialData, i18n.language)

	return (
		<Card>
			<CardHeader className='flex flex-row items-center justify-between gap-2'>
				<CardTitle>
					{t('index.monthlyCreditCardExpenses.title')}
				</CardTitle>
				<div className='w-32'>
					<Select
						options={currencyOptions}
						defaultValue={selectedCurrency}
						onValueChange={handleCurrencyChange}
					/>
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
						margin={{ left: 16, right: 16 }}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey='label'
							tickLine={false}
							axisLine={false}
							interval={0}
							angle={-45}
							textAnchor='end'
							height={60}
						/>
						<YAxis
							type='number'
							width={80}
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
							maxBarSize={48}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}
