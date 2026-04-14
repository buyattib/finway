import { Link, Form, data, useNavigation, useLocation } from 'react-router'
import {
	PlusIcon,
	ReceiptTextIcon,
	SquarePenIcon,
	TrashIcon,
} from 'lucide-react'
import { parseWithZod } from '@conform-to/zod/v4'
import { useTranslation } from 'react-i18next'

import type { Route } from './+types'

import { createToastHeaders } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { formatDate, formatNumber, getCurrencySymbol } from '~/lib/utils'
import { getBalances, getSelectData } from '~/lib/queries'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { Title } from '~/components/ui/title'
import { PageSection, PageHeader, PageContent } from '~/components/ui/page'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table'
import { TablePagination } from '~/components/table-pagination'
import { Spinner } from '~/components/ui/spinner'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'
import { TransactionType } from '~/components/transaction-type'
import { EmptyState } from '~/components/empty-state'

import { TransactionsFilters } from './components/filters'
import { DeleteTransactionFormSchema } from './lib/schemas'
import {
	getTransactions,
	getTransactionById,
	deleteTransaction,
} from './lib/queries'
import type { TCategory, TTransactionType } from './lib/types'

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
	const category = (searchParams.get('category') as TCategory) ?? ''
	const transactionType =
		(searchParams.get('transactionType') as TTransactionType) ?? ''

	const filters = {
		accountId,
		currencyId,
		category,
		transactionType,
	}

	const [{ transactions, pagination }, selectData] = await Promise.all([
		getTransactions({ db, ownerId: user.id, page, ...filters }),
		getSelectData(db, user.id),
	])

	return {
		transactions,
		pagination,
		filters,
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

	const transaction = await getTransactionById({ db, transactionId })
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

	await deleteTransaction({ db, transactionId })

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
	const { t, i18n } = useTranslation(['transactions', 'constants'])

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
					<Link to='create'>
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
					<EmptyState
						icon={ReceiptTextIcon}
						title={
							hasFilters
								? t('index.emptyFilteredMessage')
								: t('index.emptyTitle')
						}
					/>
				)}

				{transactions.length > 0 && (
					<>
						{/* Desktop table view */}
						<div className='hidden xl:block'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>
											{t('index.table.date')}
										</TableHead>
										<TableHead>
											{t('index.table.account')}
										</TableHead>
										<TableHead>
											{t('index.table.amount')}
										</TableHead>
										<TableHead>
											{t('index.table.type')}
										</TableHead>
										<TableHead>
											{t('index.table.category')}
										</TableHead>
										<TableHead className='text-right'>
											{t('index.table.actions')}
										</TableHead>
									</TableRow>
								</TableHeader>
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
											category,
										}) => {
											const symbol =
												getCurrencySymbol(currency)
											return (
												<TableRow key={id}>
													<TableCell className='text-muted-foreground'>
														{formatDate(
															new Date(date),
															i18n.language,
														)}
													</TableCell>
													<TableCell>
														<div className='flex items-center gap-2'>
															<AccountTypeIcon
																size='xs'
																accountType={
																	accountType
																}
															/>
															{account}
														</div>
													</TableCell>
													<TableCell>
														<span className='flex items-center gap-2 font-semibold text-foreground'>
															<CurrencyIcon
																currency={
																	currency
																}
																size='sm'
															/>
															{symbol}{' '}
															{formatNumber(
																amount,
																i18n.language,
															)}
														</span>
													</TableCell>
													<TableCell>
														<TransactionType
															variant='icon-text'
															size='xs'
															transactionType={
																type
															}
														/>
													</TableCell>
													<TableCell className='text-muted-foreground'>
														{t(
															`constants:categories.${category}.name`,
														)}
													</TableCell>
													<TableCell className='text-right'>
														<div className='flex items-center justify-end gap-2'>
															<Button
																asChild
																size='icon-xs'
																variant='ghost'
																disabled={
																	isDeleting
																}
															>
																<Link
																	to={`${id}/edit`}
																>
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
																	disabled={
																		isDeleting
																	}
																>
																	{isDeleting &&
																	deletingId ===
																		id ? (
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
																		{t(
																			'index.deleteAriaLabel',
																		)}
																	</span>
																</Button>
															</Form>
														</div>
													</TableCell>
												</TableRow>
											)
										},
									)}
								</TableBody>
							</Table>
						</div>

						{/* Mobile card view */}
						<ul className='flex flex-col gap-2 min-w-0 xl:hidden'>
							{transactions.map(
								({
									id,
									date,
									type,
									amount,
									currency,
									account,
									accountType,
									category,
								}) => {
									return (
										<li
											key={id}
											className='flex flex-col gap-3 border rounded-xl p-4'
										>
											<div className='flex items-center justify-between'>
												<Text size='sm' theme='muted'>
													{formatDate(
														new Date(date),
														i18n.language,
													)}
												</Text>
												<div className='flex items-center gap-2'>
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
															disabled={
																isDeleting
															}
														>
															{isDeleting &&
															deletingId ===
																id ? (
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
																{t(
																	'index.deleteAriaLabel',
																)}
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
											<div className='flex items-center justify-between'>
												<TransactionType
													variant='icon-text'
													size='xs'
													transactionType={type}
												/>
												<Text
													weight='semi'
													className='flex items-center gap-2'
													size='sm'
												>
													<CurrencyIcon
														currency={currency}
														size='sm'
													/>
													{getCurrencySymbol(
														currency,
													)}{' '}
													{formatNumber(
														amount,
														i18n.language,
													)}
												</Text>
											</div>
											<Text size='sm' theme='muted'>
												{t(
													`constants:categories.${category}.name`,
												)}
											</Text>
										</li>
									)
								},
							)}
						</ul>
					</>
				)}

				<TablePagination
					page={pagination.page}
					pages={pagination.pages}
				/>
			</PageContent>
		</PageSection>
	)
}
