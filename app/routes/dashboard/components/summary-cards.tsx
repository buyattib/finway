import { useTranslation } from 'react-i18next'
import type { Route } from '../+types'
import {
	BanknoteArrowDownIcon,
	BanknoteArrowUpIcon,
	WalletIcon,
	CreditCardIcon,
} from 'lucide-react'

import { formatNumber, getCurrencySymbol } from '~/lib/utils'

import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Text } from '~/components/ui/text'
import { CurrencyIcon } from '~/components/currency-icon'

export function SummaryCards({
	summary,
}: Pick<Route.ComponentProps['loaderData'], 'summary'>) {
	const { t } = useTranslation(['dashboard', 'components'])

	const cards = [
		{
			title: t('index.summaryCards.totalBalances'),
			icon: <WalletIcon />,
			data: summary.balances,
			empty: t('index.summaryCards.noBalances'),
		},
		{
			title: t('index.summaryCards.monthExpenses'),
			icon: <BanknoteArrowDownIcon />,
			data: summary.monthExpenses,
			empty: t('index.summaryCards.noExpenses'),
		},
		{
			title: t('index.summaryCards.monthIncomes'),
			icon: <BanknoteArrowUpIcon />,
			data: summary.monthIncomes,
			empty: t('index.summaryCards.noIncomes'),
		},
		{
			title: t('index.summaryCards.monthCreditCardTotals'),
			icon: <CreditCardIcon />,
			data: summary.monthCreditCardTotals,
			empty: t('index.summaryCards.noInstallments'),
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
								const symbol = getCurrencySymbol(currency)
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
