import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CreditCardIcon } from 'lucide-react'

import type { Route } from '../+types'

import { formatDate, formatNumber, getCurrencyData } from '~/lib/utils'

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
							const { symbol } = getCurrencyData(currency)
							return (
								<li
									key={installmentId}
									className='rounded-lg border p-3 hover:bg-muted/50 transition-colors'
								>
									<Link
										to={`/app/credit-cards/${creditCardId}/transactions/${ccTransactionId}`}
										className='grid grid-cols-2 md:grid-cols-7 items-center md:gap-4'
									>
										<Text size='sm' theme='muted'>
											{installmentNumber} /{' '}
											{totalInstallments}
										</Text>

										<TransactionType
											variant='icon-text'
											size='sm'
											transactionType={ccTransactionType}
										/>

										<div className='flex items-center gap-2 text-muted-foreground'>
											<CreditCardIcon className='size-4 shrink-0' />
											<Text size='sm' theme='muted'>
												{creditCardBrand} ••••{' '}
												{creditCardLast4}
											</Text>
										</div>

										<div className='flex flex-col gap-1'>
											<Text size='sm' theme='muted'>
												{t(
													'index.monthInstallments.transactionDate',
												)}
											</Text>
											<Text size='sm' theme='foreground'>
												{formatDate(
													new Date(ccTransactionDate),
												)}
											</Text>
										</div>

										<div className='flex flex-col gap-1'>
											<Text size='sm' theme='muted'>
												{t(
													'index.monthInstallments.dueDate',
												)}
											</Text>
											<Text size='sm' theme='foreground'>
												{formatDate(
													new Date(installmentDate),
												)}
											</Text>
										</div>

										<div className='flex flex-col gap-1'>
											<Text size='sm' theme='muted'>
												{t(
													'index.monthInstallments.category',
												)}
											</Text>
											<Text size='sm' theme='foreground'>
												{ccTransactionCategory}
											</Text>
										</div>

										<div className='flex flex-col gap-1'>
											<Text size='sm' theme='muted'>
												{t(
													'index.monthInstallments.installmentAmount',
												)}
											</Text>
											<div className='flex items-center gap-1'>
												<CurrencyIcon
													currency={currency}
													size='sm'
												/>
												<Text
													size='md'
													theme='foreground'
													weight='medium'
												>
													{symbol}{' '}
													{formatNumber(
														installmentAmount,
													)}
												</Text>
											</div>
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
