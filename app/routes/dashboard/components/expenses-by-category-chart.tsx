import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import type { TCurrency } from '~/lib/types'
import { formatNumber, getCurrencySymbol } from '~/lib/utils'

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

import type { CategoryResponse } from '../lib/types'

const chartConfig = {
	amount: {
		label: 'Amount',
		color: 'var(--chart-1)',
	},
} satisfies ChartConfig

export function ExpensesByCategoryChart({
	data,
}: {
	data: Array<CategoryResponse>
}) {
	const { t, i18n } = useTranslation(['dashboard', 'constants'])

	const dataByCurrency = data.reduce<
		Record<
			string,
			{
				code: TCurrency
				rows: Array<{ category: string; label: string; amount: number }>
			}
		>
	>((acc, row) => {
		const bucket = acc[row.currencyId] ?? {
			code: row.currency,
			rows: [],
		}
		bucket.rows.push({
			category: row.category,
			label: t(`constants:categories.${row.category}.name`),
			amount: Number(row.amount),
		})
		acc[row.currencyId] = bucket
		return acc
	}, {})

	const currencyOptions = Object.keys(dataByCurrency).map(id => {
		const code = dataByCurrency[id].code
		return {
			value: id,
			label: code,
			icon: <CurrencyIcon currency={code} size='sm' />,
		}
	})

	const [selectedCurrency, setSelectedCurrency] = useState<string>(
		currencyOptions[0]?.value ?? '',
	)

	if (!selectedCurrency) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>
						{t('dashboard:index.expensesByCategory.title')}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Text alignment='center' className='italic'>
						{t('dashboard:index.expensesByCategory.empty')}
					</Text>
				</CardContent>
			</Card>
		)
	}

	const selectedData = dataByCurrency[selectedCurrency]
	const chartData = selectedData.rows
	const symbol = getCurrencySymbol(selectedData.code)

	return (
		<Card>
			<CardHeader className='flex flex-row items-center justify-between gap-2'>
				<CardTitle>
					{t('dashboard:index.expensesByCategory.title')}
				</CardTitle>
				<div className='w-32'>
					<Select
						options={currencyOptions}
						defaultValue={selectedCurrency}
						onValueChange={setSelectedCurrency}
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
							width={120}
							tickLine={false}
							axisLine={false}
							reversed
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
