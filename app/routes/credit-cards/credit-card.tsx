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
import { eq, desc, and } from 'drizzle-orm'
import { Trans, useTranslation } from 'react-i18next'

import type { Route } from './+types/credit-card'

import {
	creditCard as creditCardTable,
	creditCardTransaction as creditCardTransactionTable,
	creditCardTransactionInstallment as creditCardTransactionInstallmentTable,
	transactionCategory as transactionCategoryTable,
} from '~/database/schema'
import {
	createToastHeaders,
	redirectWithToast,
} from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import type { TCCTransactionType } from '~/lib/types'
import { formatDate, formatNumber, getCurrencySymbol } from '~/lib/utils'
import { getSelectData } from '~/lib/queries'
import { PAGE_SIZE } from '~/lib/constants'

import { Spinner } from '~/components/ui/spinner'
import { Title } from '~/components/ui/title'
import { Text } from '~/components/ui/text'
import { Button } from '~/components/ui/button'
import { PageSection, PageHeader } from '~/components/ui/page'
import { TransactionType } from '~/components/transaction-type'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { TablePagination } from '~/components/table-pagination'

import { CreditCardHeader } from './components/credit-card-header'
import { CreditCardTransactionFilters } from './components/filters'
import {
	DeleteCreditCardFormSchema,
	DeleteCreditCardTransactionFormSchema,
} from './lib/schemas'

export function meta({ loaderData }: Route.MetaArgs) {
	if (!loaderData?.creditCard) {
		const title = loaderData?.meta.notFoundTitle
		return [
			{ title },
			{ property: 'og:title', content: title },
			{ name: 'description', content: title },
		]
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
	request,
	params: { creditCardId },
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
			closingDate: true,
			dueDate: true,
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
		throw new Response(t('details.loader.notFoundError'), { status: 404 })
	}

	const {
		account: { ownerId: _ownerId, ...account },
		currency,
		...creditCardData
	} = creditCard

	const url = new URL(request.url)
	const searchParams = url.searchParams

	const page = Number(searchParams.get('page') ?? '1')
	const type = (searchParams.get('type') as TCCTransactionType) ?? ''
	const categoryId = searchParams.get('categoryId') ?? ''

	const selectData = await getSelectData(db, user.id)

	const filters = [eq(creditCardTransactionTable.creditCardId, creditCardId)]
	if (type) {
		filters.push(eq(creditCardTransactionTable.type, type))
	}
	if (categoryId) {
		filters.push(
			eq(creditCardTransactionTable.transactionCategoryId, categoryId),
		)
	}

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
		.where(and(...filters))
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
		filters: { type, categoryId },
		selectData,
		meta: {
			title: t('details.meta.title', {
				brand: creditCardData.brand,
				last4: creditCardData.last4,
			}),
			notFoundTitle: t('details.meta.notFoundTitle', {
				creditCardId,
			}),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'credit-cards')

	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === 'delete-card') {
		const submission = parseWithZod(formData, {
			schema: DeleteCreditCardFormSchema,
		})

		if (submission.status !== 'success') {
			const toastHeaders = await createToastHeaders(request, {
				type: 'error',
				title: t('details.action.deleteCardErrorToast'),
				description: t('details.action.deleteCardErrorDescription'),
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
			throw new Response(t('details.action.notFoundError'), {
				status: 404,
			})
		}

		await db
			.delete(creditCardTable)
			.where(eq(creditCardTable.id, creditCardId))

		return await redirectWithToast('/app/credit-cards', request, {
			type: 'success',
			title: t('details.action.deleteCardSuccessToast', {
				brand: creditCard.brand,
				last4: creditCard.last4,
			}),
		})
	}

	if (intent === 'delete-transaction') {
		const submission = parseWithZod(formData, {
			schema: DeleteCreditCardTransactionFormSchema,
		})

		if (submission.status !== 'success') {
			const toastHeaders = await createToastHeaders(request, {
				type: 'error',
				title: t('details.action.deleteTransactionErrorToast'),
				description: t(
					'details.action.deleteTransactionErrorDescription',
				),
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
				title: t('details.action.transactionNotFoundToast'),
			})
			return data({}, { headers: toastHeaders })
		}

		await db
			.delete(creditCardTransactionTable)
			.where(eq(creditCardTransactionTable.id, creditCardTransactionId))

		const toastHeaders = await createToastHeaders(request, {
			type: 'success',
			title: t('details.action.deleteTransactionSuccessToast'),
		})
		return data({}, { headers: toastHeaders })
	}

	const toastHeaders = await createToastHeaders(request, {
		type: 'error',
		title: t('details.action.unknownActionToast'),
	})
	return data({}, { headers: toastHeaders })
}

export default function CreditCardDetails({
	loaderData: { creditCard, transactions, pagination, filters, selectData },
}: Route.ComponentProps) {
	const {
		id,
		brand,
		last4,
		expiryMonth,
		expiryYear,
		closingDate,
		dueDate,
		accountName,
		currencyCode,
	} = creditCard
	const location = useLocation()
	const navigation = useNavigation()
	const navigate = useNavigate()
	const { t } = useTranslation('credit-cards')

	const isLoading =
		navigation.state === 'loading' &&
		navigation.location &&
		navigation.location.search

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
		<PageSection id={id}>
			<PageHeader>
				<CreditCardHeader
					{...{
						brand,
						last4,
						expiryMonth,
						expiryYear,
						closingDate,
						dueDate,
						accountName,
						currency: currencyCode,
					}}
				/>

				<div className='flex sm:items-center gap-2'>
					<Button size='icon' variant='outline' asChild>
						<Link to='edit' prefetch='intent'>
							<SquarePenIcon />
							<span className='sr-only'>
								{t('details.editAriaLabel', {
									brand,
									last4,
								})}
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
										{t('details.deleteAriaLabel', {
											brand,
											last4,
										})}
									</span>
								</Button>
							</TooltipTrigger>
						</Form>
						<TooltipContent>
							{t('details.deleteTooltip')}
						</TooltipContent>
					</Tooltip>
				</div>
			</PageHeader>

			<PageSection id='cc-transactions-section'>
				<PageHeader>
					<Title id='cc-transactions-section' level='h3'>
						{t('details.transactionsTitle', {
							total: pagination.total,
						})}
					</Title>
					<Button asChild variant='default'>
						<Link to='transactions/create' prefetch='intent'>
							<PlusIcon aria-hidden />
							<span className='sm:inline hidden'>
								{t('details.addTransactionLabel')}
							</span>
						</Link>
					</Button>
				</PageHeader>

				<CreditCardTransactionFilters
					filters={filters}
					selectData={selectData}
				/>

				<div className='h-6'>
					{isLoading && <Spinner size='md' className='mx-auto' />}
				</div>

				{transactions.length === 0 ? (
					<Text size='md' weight='medium' alignment='center'>
						<Trans
							i18nKey='details.emptyMessage'
							ns='credit-cards'
							components={[
								<Link
									key='0'
									to='transactions/create'
									className='text-primary'
								/>,
							]}
						/>
					</Text>
				) : (
					<ul className='flex flex-col gap-2'>
						{transactions.map(
							({
								id: txId,
								date,
								type,
								amount,
								categoryName,
								installments,
							}) => {
								const symbol = getCurrencySymbol(currencyCode)
								return (
									<li
										key={txId}
										className='relative rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer'
										onClick={() =>
											navigate(`transactions/${txId}`)
										}
									>
										<Form
											method='post'
											onClick={e => e.stopPropagation()}
											className='absolute top-3 right-3'
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
												disabled={isDeletingTransaction}
											>
												{isDeletingTransaction &&
												deletingTransactionId ===
													txId ? (
													<Spinner
														aria-hidden
														size='sm'
													/>
												) : (
													<TrashIcon aria-hidden />
												)}
												<span className='sr-only'>
													{t(
														'details.deleteTransactionAriaLabel',
													)}
												</span>
											</Button>
										</Form>

										<div className='grid grid-cols-3 sm:grid-cols-5 items-center gap-4 pr-8'>
											<Text size='sm' theme='muted'>
												{formatDate(new Date(date))}
											</Text>
											<TransactionType
												variant='icon-text'
												size='xs'
												transactionType={type}
											/>
											<Text
												size='sm'
												theme='foreground'
												weight='medium'
											>
												{symbol} {formatNumber(amount)}
											</Text>
											<Text size='sm' theme='muted'>
												{categoryName}
											</Text>
											<Text size='xs' theme='muted'>
												{installments}{' '}
												{t(
													'details.table.installments',
												)}
											</Text>
										</div>
									</li>
								)
							},
						)}
					</ul>
				)}

				<TablePagination
					page={pagination.page}
					pages={pagination.pages}
				/>
			</PageSection>
		</PageSection>
	)
}
