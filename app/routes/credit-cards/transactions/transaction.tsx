import { Form, Link, data, useNavigation, useLocation } from 'react-router'
import { ArrowLeftIcon, SquarePenIcon, TrashIcon } from 'lucide-react'
import { parseWithZod } from '@conform-to/zod/v4'
import { useTranslation } from 'react-i18next'

import type { Route } from './+types/transaction'

import {
	createToastHeaders,
	redirectWithToast,
} from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext } from '~/lib/context'
import { formatDate, formatNumber, getCurrencySymbol } from '~/lib/utils'

import { Spinner } from '~/components/ui/spinner'
import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { Button } from '~/components/ui/button'
import { CreditCard } from '~/components/credit-card'
import { TransactionType } from '~/components/transaction-type'
import { CurrencyIcon } from '~/components/currency-icon'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'

import {
	getCreditCardTransactionById,
	getTransactionInstallments,
	deleteCreditCardTransaction,
} from '../lib/queries'
import { DeleteCreditCardTransactionFormSchema } from '../lib/schemas'
import { creditCardContext } from '../lib/context'

export function meta({ loaderData }: Route.MetaArgs) {
	const title = loaderData?.meta.title
	return [
		{ title },
		{ property: 'og:title', content: title },
		{ name: 'description', content: title },
	]
}

export async function loader({
	context,
	params: { transactionId },
}: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const { creditCard } = context.get(creditCardContext)
	const t = getServerT(context, 'credit-cards')

	const transaction = await getCreditCardTransactionById({
		db,
		transactionId,
	})
	if (!transaction || transaction.creditCard.id !== creditCard.id) {
		throw new Response(t('transaction.details.loader.notFoundError'), {
			status: 404,
		})
	}

	const installments = await getTransactionInstallments({
		db,
		transactionId,
	})

	const { currency, ...transactionData } = transaction

	return {
		creditCard: {
			id: creditCard.id,
			brand: creditCard.brand,
			last4: creditCard.last4,
			expiryMonth: creditCard.expiryMonth,
			expiryYear: creditCard.expiryYear,
			institution: creditCard.institution,
		},
		transaction: {
			...transactionData,
			currencyCode: currency.code,
			amount: String(transactionData.amount / 100),
		},
		installments: installments.map(i => ({
			...i,
			amount: String(i.amount / 100),
		})),
		meta: {
			title: t('transaction.details.meta.title', {
				brand: creditCard.brand,
				last4: creditCard.last4,
			}),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const db = context.get(dbContext)
	const { creditCard } = context.get(creditCardContext)
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

	const transaction = await getCreditCardTransactionById({
		db,
		transactionId: creditCardTransactionId,
	})
	if (!transaction) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: t('details.action.transactionNotFoundToast'),
		})
		return data({}, { headers: toastHeaders })
	}

	await deleteCreditCardTransaction({ db, creditCardTransactionId })

	return await redirectWithToast(
		`/app/credit-cards/${creditCard.id}`,
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
		category,
		currencyCode,
	} = transaction
	const { t, i18n } = useTranslation(['credit-cards', 'constants'])
	const navigation = useNavigation()
	const location = useLocation()

	const isDeleting =
		navigation.formMethod === 'POST' &&
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting'

	return (
		<>
			<div className='flex items-center gap-2'>
				<Button asChild variant='link' width='fit' size='icon'>
					<Link to={`/app/credit-cards/${creditCard.id}`}>
						<ArrowLeftIcon />
					</Link>
				</Button>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							asChild
							size='icon'
							variant='outline'
							className='ml-auto'
						>
							<Link to='edit'>
								<SquarePenIcon aria-hidden />
								<span className='sr-only'>
									{t(
										'transaction.details.editTransactionAriaLabel',
									)}
								</span>
							</Link>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{t('transaction.details.editTransactionAriaLabel')}
					</TooltipContent>
				</Tooltip>
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
									{t('details.deleteTransactionAriaLabel')}
								</span>
							</Button>
						</TooltipTrigger>
					</Form>
					<TooltipContent>
						{t('details.deleteTransactionAriaLabel')}
					</TooltipContent>
				</Tooltip>
			</div>

			<div className='flex flex-col lg:flex-row lg:items-start gap-6'>
				<CreditCard
					brand={creditCard.brand}
					last4={creditCard.last4}
					expiryMonth={creditCard.expiryMonth}
					expiryYear={creditCard.expiryYear}
					institution={creditCard.institution}
					className='w-full shrink-0 md:max-w-sm'
				/>
				<div className='rounded-lg border p-4 flex flex-col gap-3 w-full'>
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
								{t(`constants:categories.${category}.name`)}
							</Text>
						</div>
						<Text size='sm' theme='muted'>
							{formatDate(new Date(date), i18n.language)}
						</Text>
					</div>
					<div className='flex items-center gap-2'>
						<CurrencyIcon currency={currencyCode} size='sm' />
						<Text size='lg' weight='bold'>
							{getCurrencySymbol(currencyCode)}{' '}
							{formatNumber(amount, i18n.language)}
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
					{installments.map(({ id, amount, date }, idx) => (
						<div
							key={id}
							className='flex flex-col sm:flex-row sm:items-center gap-6 rounded-lg border p-3'
						>
							<Text size='sm' theme='muted'>
								{installments.length - idx} /{' '}
								{installments.length}
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
									{formatDate(new Date(date), i18n.language)}
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
									{formatNumber(amount, i18n.language)}
								</Text>
							</div>
						</div>
					))}
				</div>
			</section>
		</>
	)
}
