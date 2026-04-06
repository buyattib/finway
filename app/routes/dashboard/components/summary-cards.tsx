import { useTranslation } from 'react-i18next'
import type { Route } from '../+types'
import {
	BanknoteArrowDownIcon,
	BanknoteArrowUpIcon,
	WalletIcon,
} from 'lucide-react'

import { cn, formatNumber, getCurrencySymbol } from '~/lib/utils'

import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Text } from '~/components/ui/text'
import { CurrencyIcon } from '~/components/currency-icon'

type Variant = 'info' | 'danger' | 'success'

const cardBase = 'border-l-4 border-l-primary/20'

const variantStyles: Record<Variant, { card: string; icon: string }> = {
	info: {
		card: cardBase,
		icon: 'text-muted-foreground',
	},
	danger: {
		card: cardBase,
		icon: 'text-muted-foreground',
	},
	success: {
		card: cardBase,
		icon: 'text-muted-foreground',
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
	]

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
			{cards.map(({ title, icon, data, empty, variant }) => {
				const styles = variantStyles[variant]
				return (
					<Card key={title} className={cn(styles.card)}>
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
								{data.map(
									({ currencyId, currency, amount }) => {
										const symbol =
											getCurrencySymbol(currency)
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
												<Text weight='bold' size='xl'>
													{symbol}{' '}
													{formatNumber(amount)}
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
