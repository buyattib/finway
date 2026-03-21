import { useTranslation } from 'react-i18next'
import type { Route } from '../+types'
import {
	BanknoteArrowDownIcon,
	BanknoteArrowUpIcon,
	WalletIcon,
	CreditCardIcon,
} from 'lucide-react'

import { cn, formatNumber, getCurrencySymbol } from '~/lib/utils'

import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Text } from '~/components/ui/text'
import { CurrencyIcon } from '~/components/currency-icon'

type Variant = 'info' | 'danger' | 'success' | 'cc'

const variantStyles: Record<
	Variant,
	{ border: string; bg: string; icon: string }
> = {
	info: {
		border: 'border-l-4 border-l-info',
		bg: 'bg-info/5',
		icon: 'text-info',
	},
	danger: {
		border: 'border-l-4 border-l-danger',
		bg: 'bg-danger/5',
		icon: 'text-danger',
	},
	success: {
		border: 'border-l-4 border-l-success',
		bg: 'bg-success/5',
		icon: 'text-success',
	},
	cc: {
		border: 'border-l-4 border-l-cc',
		bg: 'bg-cc/5',
		icon: 'text-cc',
	},
}

export function SummaryCards({
	summary,
}: Pick<Route.ComponentProps['loaderData'], 'summary'>) {
	const { t } = useTranslation('dashboard')

	const cards = [
		{
			title: t('index.summaryCards.totalBalances'),
			icon: <WalletIcon />,
			data: summary.balances,
			empty: t('index.summaryCards.noBalances'),
			variant: 'info' as Variant,
		},
		{
			title: t('index.summaryCards.monthExpenses'),
			icon: <BanknoteArrowDownIcon />,
			data: summary.monthExpenses,
			empty: t('index.summaryCards.noExpenses'),
			variant: 'danger' as Variant,
		},
		{
			title: t('index.summaryCards.monthIncomes'),
			icon: <BanknoteArrowUpIcon />,
			data: summary.monthIncomes,
			empty: t('index.summaryCards.noIncomes'),
			variant: 'success' as Variant,
		},
		{
			title: t('index.summaryCards.monthCreditCardTotals'),
			icon: <CreditCardIcon />,
			data: summary.monthCreditCardTotals,
			empty: t('index.summaryCards.noInstallments'),
			variant: 'cc' as Variant,
		},
	]

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
			{cards.map(({ title, icon, data, empty, variant }) => {
				const styles = variantStyles[variant]
				return (
					<Card
						key={title}
						className={cn(styles.border, styles.bg)}
					>
						<CardHeader className='flex items-center justify-between'>
							<CardTitle>{title}</CardTitle>
							<span className={styles.icon}>{icon}</span>
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
											<Text
												weight='bold'
												size='xl'
											>
												{symbol} {formatNumber(amount)}
											</Text>
										</li>
									)
								})}
							</ul>
						</CardContent>
					</Card>
				)
			})}
		</div>
	)
}
