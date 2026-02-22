import type { Route } from '../+types'
import {
	BanknoteArrowDownIcon,
	BanknoteArrowUpIcon,
	WalletIcon,
	CreditCardIcon,
} from 'lucide-react'

import { formatNumber, getCurrencyData } from '~/lib/utils'

import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Text } from '~/components/ui/text'
import { CurrencyIcon } from '~/components/currency-icon'

export function SummaryCards({
	summary,
}: Pick<Route.ComponentProps['loaderData'], 'summary'>) {
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
		{
			title: 'This month credit card totals',
			icon: <CreditCardIcon />,
			data: summary.monthCreditCardTotals,
			empty: 'No installments',
		},
	]

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
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
							{data.map(({ currencyId, currency, amount }) => {
								const { symbol } = getCurrencyData(currency)
								return (
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
											{symbol} {formatNumber(amount)}
										</Text>
									</li>
								)
							})}
						</ul>
					</CardContent>
				</Card>
			))}
		</div>
	)
}
