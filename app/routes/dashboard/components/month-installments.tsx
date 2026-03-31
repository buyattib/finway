import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CreditCardIcon } from 'lucide-react'

import type { Route } from '../+types'

import { formatDate, formatNumber, getCurrencySymbol } from '~/lib/utils'

import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { TransactionType } from '~/components/transaction-type'
import { CurrencyIcon } from '~/components/currency-icon'

type LoaderData = Route.ComponentProps['loaderData']

type Props = Pick<LoaderData, 'monthInstallments'>

export function MonthInstallments({ monthInstallments }: Props) {
	const { t } = useTranslation('dashboard')

	return (
		<section
			className='flex flex-col gap-4'
			aria-labelledby='dashboard-installments'
		>
			<Title id='dashboard-installments' level='h3'>
				{t('index.monthInstallments.title', {
					count: monthInstallments.length,
				})}
			</Title>

			{monthInstallments.length === 0 ? (
				<Text alignment='center' className='italic'>
					{t('index.monthInstallments.noInstallments')}
				</Text>
			) : (
				<ul className='flex flex-col gap-2'>
					{monthInstallments.map(
						({
							installmentId,
							installmentNumber,
							installmentAmount,
							installmentDate,
							ccTransactionId,
							ccTransactionDate,
							ccTransactionType,
							totalInstallments,
							ccTransactionCategory,
							creditCardId,
							creditCardBrand,
							creditCardLast4,
							currency,
						}) => {
							const symbol = getCurrencySymbol(currency)
							return (
								<li
									key={installmentId}
									className='rounded-lg border p-3 hover:bg-muted/50 transition-colors'
								>
									<Link
										to={`/app/credit-cards/${creditCardId}/transactions/${ccTransactionId}`}
										className='flex flex-col gap-2'
									>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-2'>
												<CreditCardIcon className='size-4 shrink-0 text-muted-foreground' />
												<Text size='sm' theme='muted'>
													{creditCardBrand} ••••{' '}
													{creditCardLast4}
												</Text>
											</div>
											<Text size='xs' theme='muted'>
												{installmentNumber} /{' '}
												{totalInstallments}
											</Text>
										</div>
										<div className='flex items-center justify-between'>
											<div className='flex items-center gap-2'>
												<TransactionType
													variant='icon-text'
													size='xs'
													transactionType={
														ccTransactionType
													}
												/>
												<Text size='xs' theme='muted'>
													{ccTransactionCategory}
												</Text>
											</div>
											<Text
												size='sm'
												weight='semi'
												className='flex items-center gap-1'
											>
												<CurrencyIcon
													currency={currency}
													size='sm'
												/>
												{symbol}{' '}
												{formatNumber(
													installmentAmount,
												)}
											</Text>
										</div>
										<div className='flex items-center justify-between text-muted-foreground'>
											<Text size='xs' theme='muted'>
												{formatDate(
													new Date(ccTransactionDate),
												)}
											</Text>
											<Text size='xs' theme='muted'>
												{t(
													'index.monthInstallments.dueDate',
												)}{' '}
												{formatDate(
													new Date(installmentDate),
												)}
											</Text>
										</div>
									</Link>
								</li>
							)
						},
					)}
				</ul>
			)}
		</section>
	)
}
