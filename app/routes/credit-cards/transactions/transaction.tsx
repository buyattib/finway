import { Form, Link, data, useNavigation, useLocation } from 'react-router'
import { ArrowLeftIcon, TrashIcon } from 'lucide-react'
import { parseWithZod } from '@conform-to/zod/v4'
import { eq, asc } from 'drizzle-orm'
import { useTranslation } from 'react-i18next'

import type { Route } from './+types/transaction'

import {
	creditCardTransaction as creditCardTransactionTable,
	creditCardTransactionInstallment as creditCardTransactionInstallmentTable,
} from '~/database/schema'
import {
	createToastHeaders,
	redirectWithToast,
} from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { formatDate, formatNumber, getCurrencySymbol } from '~/lib/utils'

import { Spinner } from '~/components/ui/spinner'
import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { Button } from '~/components/ui/button'
import { TransactionType } from '~/components/transaction-type'
import { CurrencyIcon } from '~/components/currency-icon'
import { CreditCard } from '~/components/credit-card'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'

import { DeleteCreditCardTransactionFormSchema } from '../lib/schemas'

export function meta({ loaderData }: Route.MetaArgs) {
	if (!loaderData?.creditCard) {
		const title = loaderData?.meta.notFoundTitle
		return [{ title }]
	}

	const title = loaderData?.meta.title
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
	const t = getServerT(context, 'credit-cards')

	const creditCard = await db.query.creditCard.findFirst({
		where: (creditCard, { eq }) => eq(creditCard.id, creditCardId),
		columns: {
			id: true,
			brand: true,
			last4: true,
			expiryMonth: true,
			expiryYear: true,
			closingDay: true,
			dueDay: true,
		},
		with: {
			account: {
				columns: { name: true, ownerId: true },
			},
		},
	})
	if (!creditCard || creditCard.account.ownerId !== user.id) {
		throw new Response(
			t('transaction.details.loader.creditCardNotFoundError'),
			{ status: 404 },
		)
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
			currency: {
				columns: { code: true },
			},
			transactionCategory: {
				columns: { name: true },
			},
		},
	})
	if (!transaction || transaction.creditCard.id !== creditCardId) {
		throw new Response(t('transaction.details.loader.notFoundError'), {
			status: 404,
		})
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
		account: { ownerId: _ownerId, ...account },
		...creditCardData
	} = creditCard

	const { transactionCategory, currency, ...transactionData } = transaction

	return {
		creditCard: {
			...creditCardData,
			accountName: account.name,
		},
		transaction: {
			...transactionData,
			categoryName: transactionCategory.name,
			currencyCode: currency.code,
			amount: String(transactionData.amount / 100),
		},
		installments: installments.map(i => ({
			...i,
			amount: String(i.amount / 100),
		})),
		meta: {
			title: t('transaction.details.meta.title', {
				brand: creditCardData.brand,
				last4: creditCardData.last4,
			}),
			notFoundTitle: t('transaction.details.meta.notFoundTitle'),
		},
	}
}

export async function action({
	request,
	context,
	params: { creditCardId },
}: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'credit-cards')

	const formData = await request.formData()

	const submission = parseWithZod(formData, {
		schema: DeleteCreditCardTransactionFormSchema,
	})

	if (submission.status !== 'success') {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: t('details.action.deleteTransactionErrorToast'),
			description: t('details.action.deleteTransactionErrorDescription'),
		})
		return data({}, { headers: toastHeaders })
	}

	const { creditCardTransactionId } = submission.value

	const transaction = await db.query.creditCardTransaction.findFirst({
		where: (t, { eq }) => eq(t.id, creditCardTransactionId),
		columns: { id: true },
		with: {
			creditCard: {
				columns: {},
				with: { account: { columns: { ownerId: true } } },
			},
		},
	})
	if (!transaction || transaction.creditCard.account.ownerId !== user.id) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: t('details.action.transactionNotFoundToast'),
		})
		return data({}, { headers: toastHeaders })
	}

	await db
		.delete(creditCardTransactionTable)
		.where(eq(creditCardTransactionTable.id, creditCardTransactionId))

	return await redirectWithToast(
		`/app/credit-cards/${creditCardId}`,
		request,
		{
			type: 'success',
			title: t('details.action.deleteTransactionSuccessToast'),
		},
	)
}

export default function CreditCardTransaction({
	loaderData: { creditCard, transaction, installments },
}: Route.ComponentProps) {
	const {
		id: transactionId,
		date,
		type,
		amount,
		description,
		categoryName,
		currencyCode,
	} = transaction
	const { t } = useTranslation('credit-cards')
	const navigation = useNavigation()
	const location = useLocation()

	const isDeleting =
		navigation.formMethod === 'POST' &&
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	return (
		<div className='flex flex-col gap-6'>
			<Button asChild variant='link' width='fit' size='icon'>
				<Link to={`/app/credit-cards/${creditCard.id}`}>
					<ArrowLeftIcon />
				</Link>
			</Button>
			<div className='flex flex-col sm:flex-row gap-6 items-start'>
				<CreditCard {...creditCard} className='max-w-sm' />
				<div className='flex sm:items-center sm:ml-auto'>
					<Tooltip>
						<Form method='post'>
							<input
								type='hidden'
								name='creditCardTransactionId'
								value={transactionId}
							/>
							<TooltipTrigger asChild>
								<Button
									size='icon'
									variant='destructive-outline'
									type='submit'
									name='intent'
									value='delete-transaction'
									disabled={isDeleting}
								>
									{isDeleting ? (
										<Spinner size='sm' />
									) : (
										<TrashIcon aria-hidden />
									)}
									<span className='sr-only'>
										{t(
											'details.deleteTransactionAriaLabel',
										)}
									</span>
								</Button>
							</TooltipTrigger>
						</Form>
						<TooltipContent>
							{t('details.deleteTransactionAriaLabel')}
						</TooltipContent>
					</Tooltip>
				</div>
			</div>

			<div className='rounded-lg border p-4 flex flex-col gap-3'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<TransactionType
							variant='icon-text'
							size='sm'
							transactionType={type}
						/>
						<Text size='sm' theme='muted'>
							·
						</Text>
						<Text size='sm' theme='muted'>
							{categoryName}
						</Text>
					</div>
					<Text size='sm' theme='muted'>
						{formatDate(new Date(date))}
					</Text>
				</div>
				<div className='flex items-center gap-2'>
					<CurrencyIcon currency={currencyCode} size='sm' />
					<Text size='lg' weight='bold'>
						{getCurrencySymbol(currencyCode)} {formatNumber(amount)}
					</Text>
					<Text size='sm' theme='muted'>
						{currencyCode}
					</Text>
				</div>
				{description && (
					<Text size='sm' theme='muted'>
						{description}
					</Text>
				)}
			</div>

			<section
				className='flex flex-col gap-4'
				aria-labelledby='installments-section'
			>
				<Title id='installments-section' level='h3'>
					{t('transaction.details.installmentsTitle', {
						count: installments.length,
					})}
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
									{t('transaction.details.dueDate')}
								</Text>
								<Text size='sm' theme='foreground'>
									{formatDate(new Date(date))}
								</Text>
							</div>

							<div className='flex flex-col gap-1 sm:ml-auto'>
								<Text size='sm' theme='muted'>
									{t('transaction.details.installmentAmount')}
								</Text>
								<Text
									size='md'
									theme='foreground'
									weight='medium'
								>
									{getCurrencySymbol(currencyCode)}{' '}
									{formatNumber(amount)}
								</Text>
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	)
}
