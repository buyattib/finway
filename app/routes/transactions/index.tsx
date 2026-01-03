import { Link, Form, data, useNavigation, useLocation } from 'react-router'
import { PlusIcon, SquarePenIcon, TrashIcon } from 'lucide-react'
import { parseWithZod } from '@conform-to/zod/v4'
import { eq, desc, sql, and } from 'drizzle-orm'

import type { Route } from './+types'

import {
	currency as currencyTable,
	account as accountTable,
	transaction as transactionTable,
	transactionCategory as transactionCategoryTable,
} from '~/database/schema'
import { dbContext, userContext } from '~/lib/context'
import { cn, formatDate, formatNumber } from '~/lib/utils'
import { createToastHeaders } from '~/utils-server/toast.server'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { Title } from '~/components/ui/title'
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
import { Spinner } from '~/components/ui/spinner'
import { AccountTypeIcon } from '~/components/account-type-icon'

import { getBalances } from '~/routes/accounts/lib/queries'

import { TransactionsFilters } from './components/filters'
import { TRANSACTION_TYPE_DISPLAY } from './lib/constants'
import { DeleteTransactionFormSchema } from './lib/schemas'
import { getSelectData } from './lib/queries'
import type { TTransactionType } from './lib/types'

export function meta() {
	return [
		{ title: 'Transactions | Finhub' },

		{
			property: 'og:title',
			content: 'Transactions | Finhub',
		},
		{
			name: 'description',
			content: 'Your Transactions',
		},
	]
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const url = new URL(request.url)
	const searchParams = url.searchParams

	const page = Number(searchParams.get('page') ?? '1')
	const pageSize = 20

	const accountId = searchParams.get('accountId') ?? ''
	const currencyId = searchParams.get('currencyId') ?? ''
	const transactionCategoryId =
		searchParams.get('transactionCategoryId') ?? ''
	const transactionType =
		(searchParams.get('transactionType') as TTransactionType) ?? ''

	const filters = [eq(accountTable.ownerId, user.id)]
	if (accountId) {
		filters.push(eq(transactionTable.accountId, accountId))
	}

	if (currencyId) {
		filters.push(eq(transactionTable.currencyId, currencyId))
	}

	if (transactionCategoryId) {
		filters.push(
			eq(transactionTable.transactionCategoryId, transactionCategoryId),
		)
	}

	if (transactionType) {
		filters.push(eq(transactionTable.type, transactionType))
	}

	const query = db
		.select({
			id: transactionTable.id,
			date: transactionTable.date,
			amount: sql<string>`CAST(${transactionTable.amount} / 100.0 as TEXT)`,
			type: transactionTable.type,
			currency: currencyTable.code,
			account: accountTable.name,
			accountType: accountTable.accountType,
			transactionCategory: transactionCategoryTable.name,
		})
		.from(transactionTable)
		.innerJoin(
			currencyTable,
			eq(transactionTable.currencyId, currencyTable.id),
		)
		.innerJoin(
			accountTable,
			eq(transactionTable.accountId, accountTable.id),
		)
		.leftJoin(
			transactionCategoryTable,
			eq(
				transactionCategoryTable.id,
				transactionTable.transactionCategoryId,
			),
		)
		.where(and(...filters))
		.orderBy(desc(transactionTable.date), desc(transactionTable.createdAt))

	const total = await db.$count(query)
	const transactions = await query
		.limit(pageSize)
		.offset((page - 1) * pageSize)

	const pages = Math.ceil(total / pageSize)

	const selectData = await getSelectData(db, user.id)

	return {
		transactions,
		pagination: { page, pages, total },
		filters: {
			accountId,
			currencyId,
			transactionCategoryId,
			transactionType,
		},
		selectData,
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: DeleteTransactionFormSchema,
	})

	if (submission.status !== 'success') {
		console.error(submission.reply())

		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: 'Could not delete transaction',
			description: 'Please try again',
		})
		return data({}, { headers: toastHeaders })
	}

	const { transactionId } = submission.value

	const transaction = await db.query.transaction.findFirst({
		where: (transaction, { eq }) => eq(transaction.id, transactionId),
		columns: { id: true, accountId: true, currencyId: true, amount: true },
		with: { account: { columns: { ownerId: true } } },
	})
	if (!transaction || transaction.account.ownerId !== user.id) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: `Transaction ${transactionId} not found`,
		})
		return data({}, { headers: toastHeaders })
	}

	const [{ balance }] = await getBalances(
		db,
		user.id,
		transaction.accountId,
		transaction.currencyId,
		false,
	)
	if (balance < transaction.amount) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: 'Cannot delete transaction as account would hold a negative balance',
		})
		return data({}, { headers: toastHeaders })
	}

	await db
		.delete(transactionTable)
		.where(eq(transactionTable.id, transactionId))

	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: 'Transaction deleted',
	})
	return data({}, { headers: toastHeaders })
}

export default function Transactions({
	loaderData: { transactions, selectData, pagination, filters },
}: Route.ComponentProps) {
	const location = useLocation()
	const navigation = useNavigation()
	const isDeleting =
		navigation.formMethod === 'POST' &&
		navigation.formAction === location.pathname + '?index' &&
		navigation.state === 'submitting' &&
		navigation.formData?.get('intent') === 'delete'

	const deletingId = navigation.formData?.get('transactionId')

	const isLoading =
		navigation.state === 'loading' &&
		navigation.location &&
		navigation.location.search

	const hasFilters = !!Object.entries(filters).length

	return (
		<section
			className='flex flex-col gap-4'
			aria-labelledby='transactions-section'
		>
			<div className='flex items-center justify-between'>
				<Title id='transactions-section' level='h3'>
					Transactions ({pagination.total})
				</Title>
				<Button
					asChild
					variant='default'
					autoFocus
					disabled={isDeleting}
				>
					<Link to='create' prefetch='intent'>
						<PlusIcon aria-hidden />
						<span className='sm:inline hidden'>Transaction</span>
					</Link>
				</Button>
			</div>

			<TransactionsFilters filters={filters} selectData={selectData} />

			<div className='h-6'>
				{isLoading && <Spinner size='md' className='mx-auto' />}
			</div>

			<Table>
				{transactions.length === 0 && (
					<TableCaption>
						<Text size='md' weight='medium' alignment='center'>
							{!hasFilters ? (
								<>
									You have not created any transactions yet.
									Start creating them{' '}
									<Link to='create' className='text-primary'>
										here
									</Link>
								</>
							) : (
								'No transactions found with applied filters'
							)}
						</Text>
					</TableCaption>
				)}
				{transactions.length !== 0 && (
					<TableHeader>
						<TableRow>
							<TableHead>Date</TableHead>
							<TableHead className='text-center'>
								Account
							</TableHead>
							<TableHead className='text-center'>
								Category
							</TableHead>
							<TableHead className='text-center'>Type</TableHead>
							<TableHead className='text-center'>
								Amount
							</TableHead>
							<TableHead></TableHead>
						</TableRow>
					</TableHeader>
				)}
				<TableBody>
					{transactions.map(
						({
							id,
							date,
							type,
							amount,
							currency,
							account,
							accountType,
							transactionCategory,
						}) => {
							const { label: typeLabel, color: typeColor } =
								TRANSACTION_TYPE_DISPLAY[type]

							return (
								<TableRow key={id}>
									<TableCell className='w-30'>
										{formatDate(new Date(date))}
									</TableCell>
									<TableCell>
										<div className='flex justify-center items-center gap-2'>
											<AccountTypeIcon
												size='xs'
												accountType={accountType}
											/>
											{account}
										</div>
									</TableCell>
									<TableCell className='text-center'>
										{transactionCategory ?? '-'}
									</TableCell>
									<TableCell
										className={cn(
											'text-center',
											`text-${typeColor}`,
										)}
									>
										{typeLabel}
									</TableCell>
									<TableCell className='text-center'>
										<b>{currency}</b> {formatNumber(amount)}
									</TableCell>
									<TableCell className='flex justify-end items-center gap-2'>
										<Button
											asChild
											size='icon-xs'
											variant='ghost'
											disabled={isDeleting}
										>
											<Link to={`${id}/edit`}>
												<SquarePenIcon />
											</Link>
										</Button>
										<Form method='post'>
											<input
												type='hidden'
												name='transactionId'
												value={id}
											/>
											<Button
												size='icon-xs'
												variant='destructive-ghost'
												type='submit'
												name='intent'
												value='delete'
												disabled={isDeleting}
											>
												{isDeleting &&
												deletingId === id ? (
													<Spinner
														aria-hidden
														size='sm'
													/>
												) : (
													<TrashIcon aria-hidden />
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
						{Array.from(Array(pagination.pages).keys()).map(v => (
							<PaginationItem key={v}>
								<PaginationLink
									prefetch='intent'
									to={{ search: `?page=${v + 1}` }}
									isActive={pagination.page === v + 1}
								>
									{v + 1}
								</PaginationLink>
							</PaginationItem>
						))}
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
	)
}
