import { Link, Form, data, useNavigation, useLocation } from 'react-router'
import { PlusIcon, SquarePenIcon, TrashIcon } from 'lucide-react'
import { parseWithZod } from '@conform-to/zod/v4'
import { eq, desc, sql, and } from 'drizzle-orm'
import { Trans, useTranslation } from 'react-i18next'

import type { Route } from './+types'

import {
	currency as currencyTable,
	account as accountTable,
	transaction as transactionTable,
	transactionCategory as transactionCategoryTable,
} from '~/database/schema'
import { createToastHeaders } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { formatDate, formatNumber } from '~/lib/utils'
import { PAGE_SIZE } from '~/lib/constants'
import { getBalances, getSelectData } from '~/lib/queries'
import type { TTransactionType } from '~/lib/types'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { Title } from '~/components/ui/title'
import { PageSection, PageHeader, PageContent } from '~/components/ui/page'
import { TablePagination } from '~/components/table-pagination'
import { Spinner } from '~/components/ui/spinner'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'
import { TransactionType } from '~/components/transaction-type'

import { TransactionsFilters } from './components/filters'
import { DeleteTransactionFormSchema } from './lib/schemas'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)
	const t = getServerT(context, 'transactions')

	const url = new URL(request.url)
	const searchParams = url.searchParams

	const page = Number(searchParams.get('page') ?? '1')

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
		.limit(PAGE_SIZE)
		.offset((page - 1) * PAGE_SIZE)

	const pages = Math.ceil(total / PAGE_SIZE)

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
		meta: {
			title: t('index.meta.title'),
			description: t('index.meta.description'),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'transactions')

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: DeleteTransactionFormSchema,
	})

	if (submission.status !== 'success') {
		console.error(submission.reply())

		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: t('index.action.deleteErrorToast'),
			description: t('index.action.deleteErrorToastDescription'),
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
			title: t('index.action.notFoundError', { transactionId }),
		})
		return data({}, { headers: toastHeaders })
	}

	const { accountId, currencyId } = transaction

	const [{ balance }] = await getBalances({
		db,
		ownerId: user.id,
		accountId,
		currencyId,
		parseBalance: false,
	})
	if (balance < transaction.amount) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: t('index.action.negativeBalanceError'),
		})
		return data({}, { headers: toastHeaders })
	}

	await db
		.delete(transactionTable)
		.where(eq(transactionTable.id, transactionId))

	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: t('index.action.successToast'),
	})
	return data({}, { headers: toastHeaders })
}

export default function Transactions({
	loaderData: { transactions, selectData, pagination, filters },
}: Route.ComponentProps) {
	const location = useLocation()
	const navigation = useNavigation()
	const { t } = useTranslation(['transactions', 'constants'])

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

	const hasFilters = Object.values(filters).some(Boolean)

	return (
		<PageSection id='transactions-section'>
			<PageHeader>
				<Title id='transactions-section' level='h3'>
					{t('index.title', { total: pagination.total })}
				</Title>
				<Button
					asChild
					variant='default'
					autoFocus
					disabled={isDeleting}
				>
					<Link to='create' prefetch='intent'>
						<PlusIcon aria-hidden />
						<span className='sm:inline hidden'>
							{t('index.addTransactionLabel')}
						</span>
					</Link>
				</Button>
			</PageHeader>

			<PageContent>
				<TransactionsFilters
					filters={filters}
					selectData={selectData}
				/>

				<div className='h-6'>
					{isLoading && <Spinner size='md' className='mx-auto' />}
				</div>

				{transactions.length === 0 && (
					<div className='my-2'>
						<Text size='md' weight='medium' alignment='center'>
							{!hasFilters ? (
								<Trans
									ns='transactions'
									i18nKey='index.emptyMessage'
								>
									You have not created any transactions yet.
									Start creating them{' '}
									<Link to='create' className='text-primary'>
										here
									</Link>
								</Trans>
							) : (
								t('index.emptyFilteredMessage')
							)}
						</Text>
					</div>
				)}

				<ul className='flex flex-col gap-2 min-w-0'>
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
						}) => (
							<li
								key={id}
								className='grid grid-cols-1 xl:grid-cols-[1fr_2fr_2fr_1fr_2fr_auto] items-center gap-4 border rounded-xl p-4 xl:px-6'
							>
								<div className='flex items-center justify-between xl:contents'>
									<Text size='sm' theme='muted'>
										{formatDate(new Date(date))}
									</Text>
									<div className='flex items-center gap-2 xl:order-last'>
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
													{t('index.deleteAriaLabel')}
												</span>
											</Button>
										</Form>
									</div>
								</div>
								<div className='flex items-center gap-2'>
									<AccountTypeIcon
										size='xs'
										accountType={accountType}
									/>
									<Text size='sm'>{account}</Text>
								</div>
								<Text
									weight='medium'
									className='flex items-center gap-2'
									size='sm'
								>
									<CurrencyIcon
										currency={currency}
										size='sm'
									/>
									<b>{currency}</b> {formatNumber(amount)}
								</Text>
								<TransactionType
									variant='icon-text'
									size='xs'
									transactionType={type}
								/>
								<Text size='sm' theme='muted'>
									{transactionCategory ?? '-'}
								</Text>
							</li>
						),
					)}
				</ul>

				<TablePagination
					page={pagination.page}
					pages={pagination.pages}
				/>
			</PageContent>
		</PageSection>
	)
}
