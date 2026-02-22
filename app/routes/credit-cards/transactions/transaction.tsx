import { Link } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { eq, asc } from 'drizzle-orm'

import type { Route } from './+types/transaction'

import { dbContext, userContext } from '~/lib/context'
import { creditCardTransactionInstallment as creditCardTransactionInstallmentTable } from '~/database/schema'
import { cn, formatDate, formatNumber } from '~/lib/utils'

import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { Button } from '~/components/ui/button'
import { CreditCardHeader } from '../components/credit-card-header'
import { TransactionType } from '~/components/transaction-type'

export function meta({ loaderData }: Route.MetaArgs) {
	if (!loaderData?.creditCard) {
		return [{ title: 'Transaction not found | Finway' }]
	}

	const { brand, last4 } = loaderData.creditCard
	const title = `Transaction · ${brand} •••• ${last4} | Finway`

	return [
		{ title },
		{ property: 'og:title', content: title },
		{ name: 'description', content: title },
	]
}

export async function loader({
	context,
	params: { creditCardId, transactionId },
}: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const creditCard = await db.query.creditCard.findFirst({
		where: (creditCard, { eq }) => eq(creditCard.id, creditCardId),
		columns: {
			id: true,
			brand: true,
			last4: true,
			expiryMonth: true,
			expiryYear: true,
		},
		with: {
			account: {
				columns: { name: true, ownerId: true },
			},
			currency: {
				columns: { code: true },
			},
		},
	})
	if (!creditCard || creditCard.account.ownerId !== user.id) {
		throw new Response('Transaction not found', { status: 404 })
	}

	const transaction = await db.query.creditCardTransaction.findFirst({
		where: (tx, { eq }) => eq(tx.id, transactionId),
		columns: {
			id: true,
			date: true,
			type: true,
			amount: true,
			description: true,
		},
		with: {
			creditCard: {
				columns: { id: true },
			},
			transactionCategory: {
				columns: { name: true },
			},
		},
	})
	if (!transaction || transaction.creditCard.id !== creditCardId) {
		throw new Response('Transaction not found', { status: 404 })
	}

	const installments = await db
		.select({
			installmentNumber:
				creditCardTransactionInstallmentTable.installmentNumber,
			amount: creditCardTransactionInstallmentTable.amount,
			date: creditCardTransactionInstallmentTable.date,
		})
		.from(creditCardTransactionInstallmentTable)
		.where(
			eq(
				creditCardTransactionInstallmentTable.creditCardTransactionId,
				transactionId,
			),
		)
		.orderBy(asc(creditCardTransactionInstallmentTable.installmentNumber))

	const {
		account: { ownerId, ...account },
		currency,
		...creditCardData
	} = creditCard

	const { transactionCategory, ...transactionData } = transaction

	return {
		creditCard: {
			...creditCardData,
			accountName: account.name,
			currencyCode: currency.code,
		},
		transaction: {
			...transactionData,
			categoryName: transactionCategory.name,
			amount: String(transactionData.amount / 100),
		},
		installments: installments.map(i => ({
			...i,
			amount: String(i.amount / 100),
		})),
	}
}

export default function CreditCardTransaction({
	loaderData: { creditCard, transaction, installments },
}: Route.ComponentProps) {
	const { brand, last4, expiryMonth, expiryYear, accountName, currencyCode } =
		creditCard

	const { date, type, amount, description, categoryName } = transaction

	return (
		<div className='flex flex-col gap-6'>
			<div className='flex flex-col gap-2'>
				<Button asChild variant='ghost' size='icon' className='mr-auto'>
					<Link to='../..' relative='path'>
						<ArrowLeftIcon />
						<span className='sr-only'>Back to credit card</span>
					</Link>
				</Button>
				<CreditCardHeader
					{...{
						brand,
						last4,
						expiryMonth,
						expiryYear,
						accountName,
						currency: currencyCode,
					}}
				/>
			</div>

			<div
				className={cn('grid grid-cols-2 gap-6', {
					'md:grid-cols-4': !description,
					'md:grid-cols-5': !!description,
				})}
			>
				<div className='flex flex-col gap-1'>
					<Text size='sm' theme='muted'>
						Date
					</Text>
					<Text size='md' theme='foreground'>
						{formatDate(new Date(date))}
					</Text>
				</div>
				<div className='flex flex-col gap-1'>
					<Text size='sm' theme='muted'>
						Type
					</Text>
					<TransactionType
						variant='icon-text'
						size='sm'
						transactionType={type}
					/>
				</div>
				<div className='flex flex-col gap-1'>
					<Text size='sm' theme='muted'>
						Amount
					</Text>
					<Text size='md' theme='foreground'>
						{currencyCode} {formatNumber(amount)}
					</Text>
				</div>
				<div className='flex flex-col gap-1'>
					<Text size='sm' theme='muted'>
						Category
					</Text>
					<Text size='md' theme='foreground'>
						{categoryName}
					</Text>
				</div>
				{description && (
					<div className='flex flex-col gap-1'>
						<Text size='sm' theme='muted'>
							Description
						</Text>
						<Text size='md' theme='foreground'>
							{description}
						</Text>
					</div>
				)}
			</div>

			<section
				className='flex flex-col gap-4'
				aria-labelledby='installments-section'
			>
				<Title id='installments-section' level='h3'>
					Installments ({installments.length})
				</Title>

				<div className='flex flex-col gap-2'>
					{installments.map(({ installmentNumber, amount, date }) => (
						<div
							key={installmentNumber}
							className='flex flex-col sm:flex-row sm:items-center gap-6 rounded-lg border p-3'
						>
							<Text size='sm' theme='muted'>
								{installmentNumber} / {installments.length}
							</Text>
							<Text
								size='sm'
								theme='muted'
								className='hidden sm:block'
							>
								·
							</Text>
							<div className='flex flex-col gap-1'>
								<Text size='sm' theme='muted'>
									Due Date
								</Text>
								<Text size='sm' theme='foreground'>
									{formatDate(new Date(date))}
								</Text>
							</div>

							<div className='flex flex-col gap-1 sm:ml-auto'>
								<Text size='sm' theme='muted'>
									Installment Amount
								</Text>
								<Text
									size='md'
									theme='foreground'
									weight='medium'
								>
									{currencyCode} {formatNumber(amount)}
								</Text>
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	)
}
