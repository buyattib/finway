import { Link } from 'react-router'
import { CreditCardIcon } from 'lucide-react'

import { formatDate, formatNumber, getCurrencyData } from '~/lib/utils'

import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { TransactionType } from '~/components/transaction-type'
import { CurrencyIcon } from '~/components/currency-icon'

import type { Route } from '../+types'

type LoaderData = Route.ComponentProps['loaderData']

type Props = Pick<LoaderData, 'monthInstallments'>

export function MonthInstallments({ monthInstallments }: Props) {
	return (
		<section
			className='flex flex-col gap-4'
			aria-labelledby='dashboard-installments'
		>
			<Title id='dashboard-installments' level='h3'>
				This month installments ({monthInstallments.length})
			</Title>

			{monthInstallments.length === 0 ? (
				<Text alignment='center' className='italic'>
					No installments due this month
				</Text>
			) : (
				<div className='flex flex-col gap-2'>
					{monthInstallments.map(
						({
							installmentId,
							installmentNumber,
							installmentAmount,
							installmentDate,
							ccTransactionId,
							ccTransactionDate,
							ccTransactionType,
							ccTransactionDescription,
							totalInstallments,
							ccTransactionCategory,
							creditCardId,
							creditCardBrand,
							creditCardLast4,
							currency,
						}) => {
							const { symbol } = getCurrencyData(currency)
							return (
								<Link
									key={installmentId}
									to={`/app/credit-cards/${creditCardId}/transactions/${ccTransactionId}`}
									className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors'
								>
									<Text size='sm' theme='muted'>
										{installmentNumber} /{' '}
										{totalInstallments}
									</Text>

									<div className='flex items-center gap-2 text-muted-foreground'>
										<CreditCardIcon className='size-4 shrink-0' />
										<Text size='sm' theme='muted'>
											{creditCardBrand} ••••{' '}
											{creditCardLast4}
										</Text>
									</div>

									<TransactionType
										variant='icon-text'
										size='sm'
										transactionType={ccTransactionType}
									/>

									<div className='flex flex-col gap-1'>
										<Text size='sm' theme='muted'>
											Transaction date
										</Text>
										<Text size='sm' theme='foreground'>
											{formatDate(
												new Date(ccTransactionDate),
											)}
										</Text>
									</div>

									<div className='flex flex-col gap-1'>
										<Text size='sm' theme='muted'>
											Due date
										</Text>
										<Text size='sm' theme='foreground'>
											{formatDate(
												new Date(installmentDate),
											)}
										</Text>
									</div>

									<div className='flex flex-col gap-1'>
										<Text size='sm' theme='muted'>
											Category
										</Text>
										<Text size='sm' theme='foreground'>
											{ccTransactionCategory}
										</Text>
									</div>

									{ccTransactionDescription && (
										<div className='flex flex-col gap-1'>
											<Text size='sm' theme='muted'>
												Description
											</Text>
											<Text size='sm' theme='foreground'>
												{ccTransactionDescription}
											</Text>
										</div>
									)}

									<div className='flex flex-col gap-1'>
										<Text size='sm' theme='muted'>
											Installment amount
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
							)
						},
					)}
				</div>
			)}
		</section>
	)
}
