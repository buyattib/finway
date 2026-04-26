import { useTranslation } from 'react-i18next'
import { WalletIcon } from 'lucide-react'

import type { Route } from '../+types'

import { formatNumber, getCurrencySymbol } from '~/lib/utils'

import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Text } from '~/components/ui/text'
import { CurrencyIcon } from '~/components/currency-icon'
import { TransactionType } from '~/components/transaction-type'

import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
} from '~/features/transactions/constants'

export function SummaryCards({
	summary,
}: Pick<Route.ComponentProps['loaderData'], 'summary'>) {
	const { t, i18n } = useTranslation('dashboard')

	const cards = [
		{
			title: t('index.summaryCards.totalBalances'),
			icon: <WalletIcon />,
			data: summary.balances,
			empty: t('index.summaryCards.noBalances'),
		},
		{
			title: t('index.summaryCards.monthExpenses'),
			icon: (
				<TransactionType
					type='transaction'
					transactionType={TRANSACTION_TYPE_EXPENSE}
					variant='icon'
				/>
			),
			data: summary.monthExpenses,
			empty: t('index.summaryCards.noExpenses'),
		},
		{
			title: t('index.summaryCards.monthIncomes'),
			icon: (
				<TransactionType
					type='transaction'
					transactionType={TRANSACTION_TYPE_INCOME}
					variant='icon'
				/>
			),
			data: summary.monthIncomes,
			empty: t('index.summaryCards.noIncomes'),
		},
	]

	return (
		<div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
			{cards.map(({ title, icon, data, empty }) => {
				return (
					<Card
						key={title}
						className='border-l-4 border-l-primary/20'
					>
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
									({ currencyId, currency, amount }) => {
										const symbol =
											getCurrencySymbol(currency)
										return (
											<li
												key={currencyId}
												className='flex flex-row items-center justify-between gap-2'
											>
												<Text className='flex items-center gap-2'>
													<CurrencyIcon
														currency={currency}
														size='sm'
													/>
													{currency}
												</Text>
												<Text
													weight='bold'
													size='lg'
													className='whitespace-nowrap'
												>
													{symbol}{' '}
													{formatNumber(
														amount,
														i18n.language,
													)}
												</Text>
											</li>
										)
									},
								)}
							</ul>
						</CardContent>
					</Card>
				)
			})}
		</div>
	)
}
