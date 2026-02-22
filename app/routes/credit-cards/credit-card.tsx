import {
	Link,
	Form,
	data,
	useNavigation,
	useLocation,
	useNavigate,
} from 'react-router'
import { SquarePenIcon, TrashIcon, PlusIcon } from 'lucide-react'
import { parseWithZod } from '@conform-to/zod/v4'
import { eq, desc } from 'drizzle-orm'

import type { Route } from './+types/credit-card'

import { dbContext, userContext } from '~/lib/context'
import {
	creditCard as creditCardTable,
	creditCardTransaction as creditCardTransactionTable,
	creditCardTransactionInstallment as creditCardTransactionInstallmentTable,
	transactionCategory as transactionCategoryTable,
} from '~/database/schema'
import { formatDate, formatNumber } from '~/lib/utils'
import {
	createToastHeaders,
	redirectWithToast,
} from '~/utils-server/toast.server'

import { Spinner } from '~/components/ui/spinner'
import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { Button } from '~/components/ui/button'
import { TransactionType } from '~/components/transaction-type'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table'
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '~/components/ui/pagination'

import { CreditCardHeader } from './components/credit-card-header'
import {
	DeleteCreditCardFormSchema,
	DeleteCreditCardTransactionFormSchema,
} from './lib/schemas'

const PAGE_SIZE = 20

export function meta({ loaderData, params: { creditCardId } }: Route.MetaArgs) {
	if (!loaderData?.creditCard) {
		return [
			{
				title: `Credit card ${creditCardId} not found | Finway`,
			},
			{
				property: 'og:title',
				content: `Credit card ${creditCardId} not found | Finway`,
			},
			{
				name: 'description',
				content: `Credit card ${creditCardId} not found | Finway`,
			},
		]
	}

	const {
		creditCard: { brand, last4 },
	} = loaderData

	return [
		{
			title: `Credit Card ${brand} •••• ${last4} | Finway`,
		},
		{
			property: 'og:title',
			content: `Credit Card ${brand} •••• ${last4} | Finway`,
		},
		{
			name: 'description',
			content: `Credit Card ${brand} •••• ${last4} | Finway`,
		},
	]
}

export async function loader({
	context,
	request,
	params: { creditCardId },
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
		throw new Response('Credit card not found', { status: 404 })
	}

	const {
		account: { ownerId, ...account },
		currency,
		...creditCardData
	} = creditCard

	const url = new URL(request.url)
	const page = Number(url.searchParams.get('page') ?? '1')

	const transactionsQuery = db
		.select({
			id: creditCardTransactionTable.id,
			date: creditCardTransactionTable.date,
			type: creditCardTransactionTable.type,
			amount: creditCardTransactionTable.amount,
			description: creditCardTransactionTable.description,
			categoryName: transactionCategoryTable.name,
			installments: db.$count(
				creditCardTransactionInstallmentTable,
				eq(
					creditCardTransactionTable.id,
					creditCardTransactionInstallmentTable.creditCardTransactionId,
				),
			),
		})
		.from(creditCardTransactionTable)
		.innerJoin(
			transactionCategoryTable,
			eq(
				creditCardTransactionTable.transactionCategoryId,
				transactionCategoryTable.id,
			),
		)
		.innerJoin(
			creditCardTransactionInstallmentTable,
			eq(
				creditCardTransactionTable.id,
				creditCardTransactionInstallmentTable.creditCardTransactionId,
			),
		)
		.where(eq(creditCardTransactionTable.creditCardId, creditCardId))
		.groupBy(creditCardTransactionTable.id)
		.orderBy(
			desc(creditCardTransactionTable.date),
			desc(creditCardTransactionTable.createdAt),
		)

	const total = await db.$count(transactionsQuery)
	const transactions = await transactionsQuery
		.limit(PAGE_SIZE)
		.offset((page - 1) * PAGE_SIZE)

	return {
		creditCard: {
			...creditCardData,
			accountName: account.name,
			currencyCode: currency.code,
		},
		transactions: transactions.map(t => ({
			...t,
			amount: String(t.amount / 100),
		})),
		pagination: { page, pages: Math.ceil(total / PAGE_SIZE), total },
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === 'delete-card') {
		const submission = parseWithZod(formData, {
			schema: DeleteCreditCardFormSchema,
		})

		if (submission.status !== 'success') {
			const toastHeaders = await createToastHeaders(request, {
				type: 'error',
				title: 'Could not delete credit card',
				description: 'Please try again',
			})
			return data({}, { headers: toastHeaders })
		}

		const { creditCardId } = submission.value
		const creditCard = await db.query.creditCard.findFirst({
			where: eq(creditCardTable.id, creditCardId),
			columns: { brand: true, last4: true },
			with: {
				account: { columns: { ownerId: true } },
			},
		})
		if (!creditCard || creditCard.account.ownerId !== user.id) {
			throw new Response('Credit card not found', { status: 404 })
		}

		await db
			.delete(creditCardTable)
			.where(eq(creditCardTable.id, creditCardId))

		return await redirectWithToast('/app/credit-cards', request, {
			type: 'success',
			title: `Credit card ${creditCard.brand} •••• ${creditCard.last4} deleted`,
		})
	}

	if (intent === 'delete-transaction') {
		const submission = parseWithZod(formData, {
			schema: DeleteCreditCardTransactionFormSchema,
		})

		if (submission.status !== 'success') {
			const toastHeaders = await createToastHeaders(request, {
				type: 'error',
				title: 'Could not delete transaction',
				description: 'Please try again',
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
		if (
			!transaction ||
			transaction.creditCard.account.ownerId !== user.id
		) {
			const toastHeaders = await createToastHeaders(request, {
				type: 'error',
				title: `Transaction not found`,
			})
			return data({}, { headers: toastHeaders })
		}

		await db
			.delete(creditCardTransactionTable)
			.where(eq(creditCardTransactionTable.id, creditCardTransactionId))

		const toastHeaders = await createToastHeaders(request, {
			type: 'success',
			title: 'Transaction deleted',
		})
		return data({}, { headers: toastHeaders })
	}

	const toastHeaders = await createToastHeaders(request, {
		type: 'error',
		title: 'Unknown action',
	})
	return data({}, { headers: toastHeaders })
}

export default function CreditCardDetails({
	loaderData: { creditCard, transactions, pagination },
}: Route.ComponentProps) {
	const {
		id,
		brand,
		last4,
		expiryMonth,
		expiryYear,
		accountName,
		currencyCode,
	} = creditCard
	const location = useLocation()
	const navigation = useNavigation()
	const navigate = useNavigate()

	const isDeletingCard =
		navigation.formMethod === 'POST' &&
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting' &&
		navigation.formData?.get('intent') === 'delete-card'

	const isDeletingTransaction =
		navigation.formMethod === 'POST' &&
		navigation.formAction === location.pathname &&
		navigation.state === 'submitting' &&
		navigation.formData?.get('intent') === 'delete-transaction'

	const deletingTransactionId = navigation.formData?.get(
		'creditCardTransactionId',
	)

	return (
		<div className='flex flex-col gap-6'>
			<div className='flex flex-col gap-4'>
				<div className='flex items-center gap-4'>
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

					<div className='flex items-center gap-2 ml-auto'>
						<Button size='icon' variant='outline' asChild>
							<Link to='edit' prefetch='intent'>
								<SquarePenIcon />
								<span className='sr-only'>
									Edit {brand} •••• {last4}
								</span>
							</Link>
						</Button>
						<Tooltip>
							<Form method='post'>
								<input
									type='hidden'
									name='creditCardId'
									value={id}
								/>
								<TooltipTrigger asChild>
									<Button
										size='icon'
										variant='destructive-outline'
										type='submit'
										name='intent'
										value='delete-card'
										disabled={isDeletingCard}
									>
										{isDeletingCard ? (
											<Spinner size='sm' />
										) : (
											<TrashIcon aria-hidden />
										)}
										<span className='sr-only'>
											Delete credit card {brand} ••••{' '}
											{last4}
										</span>
									</Button>
								</TooltipTrigger>
							</Form>
							<TooltipContent>
								Deleting a credit card cannot be undone.
							</TooltipContent>
						</Tooltip>
					</div>
				</div>
			</div>

			<section
				className='flex flex-col gap-4'
				aria-labelledby='cc-transactions-section'
			>
				<div className='flex items-center justify-between'>
					<Title id='cc-transactions-section' level='h3'>
						Transactions ({pagination.total})
					</Title>
					<Button asChild variant='default'>
						<Link to='transactions/create' prefetch='intent'>
							<PlusIcon aria-hidden />
							<span className='sm:inline hidden'>
								Transaction
							</span>
						</Link>
					</Button>
				</div>

				<Table>
					{transactions.length === 0 && (
						<TableCaption>
							<Text size='md' weight='medium' alignment='center'>
								No transactions yet.{' '}
								<Link
									to='transactions/create'
									className='text-primary'
								>
									Create one
								</Link>
							</Text>
						</TableCaption>
					)}
					{transactions.length !== 0 && (
						<TableHeader>
							<TableRow>
								<TableHead>Date</TableHead>
								<TableHead className='text-center'>
									Category
								</TableHead>
								<TableHead className='text-center'>
									Type
								</TableHead>
								<TableHead className='text-center'>
									Amount
								</TableHead>
								<TableHead className='text-center'>
									Installments
								</TableHead>
								<TableHead></TableHead>
							</TableRow>
						</TableHeader>
					)}
					<TableBody>
						{transactions.map(
							({
								id: txId,
								date,
								type,
								amount,
								categoryName,
								installments,
							}) => {
								return (
									<TableRow
										key={txId}
										className='cursor-pointer'
										onClick={() =>
											navigate(`transactions/${txId}`)
										}
									>
										<TableCell className='w-30'>
											{formatDate(new Date(date))}
										</TableCell>
										<TableCell className='text-center'>
											{categoryName}
										</TableCell>
										<TableCell className='text-center'>
											<TransactionType
												variant='text'
												transactionType={type}
											/>
										</TableCell>
										<TableCell className='text-center'>
											<b>{currencyCode}</b>{' '}
											{formatNumber(amount)}
										</TableCell>
										<TableCell className='text-center'>
											{installments}
										</TableCell>
										<TableCell className='flex justify-end items-center gap-2'>
											<Form
												method='post'
												onClick={e =>
													e.stopPropagation()
												}
											>
												<input
													type='hidden'
													name='creditCardTransactionId'
													value={txId}
												/>
												<Button
													size='icon-xs'
													variant='destructive-ghost'
													type='submit'
													name='intent'
													value='delete-transaction'
													disabled={
														isDeletingTransaction
													}
												>
													{isDeletingTransaction &&
													deletingTransactionId ===
														txId ? (
														<Spinner
															aria-hidden
															size='sm'
														/>
													) : (
														<TrashIcon
															aria-hidden
														/>
													)}
													<span className='sr-only'>
														Delete transaction
													</span>
												</Button>
											</Form>
										</TableCell>
									</TableRow>
								)
							},
						)}
					</TableBody>
				</Table>

				{pagination.pages > 1 && (
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									prefetch='intent'
									to={{
										search: `?page=${pagination.page === 1 ? 1 : pagination.page - 1}`,
									}}
								/>
							</PaginationItem>
							{Array.from(Array(pagination.pages).keys()).map(
								v => (
									<PaginationItem key={v}>
										<PaginationLink
											prefetch='intent'
											to={{ search: `?page=${v + 1}` }}
											isActive={pagination.page === v + 1}
										>
											{v + 1}
										</PaginationLink>
									</PaginationItem>
								),
							)}
							<PaginationItem>
								<PaginationNext
									prefetch='intent'
									to={{
										search: `?page=${pagination.page === pagination.pages ? pagination.pages : pagination.page + 1}`,
									}}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				)}
			</section>
		</div>
	)
}
