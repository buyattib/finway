import { Form, useNavigation } from 'react-router'
import { ReceiptTextIcon, TrashIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Route } from '../../+types'

import { formatDate, formatNumber, getCurrencySymbol } from '~/lib/utils'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table'
import { Spinner } from '~/components/ui/spinner'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'
import { TransactionType } from '~/components/transaction-type'
import { EmptyState } from '~/components/empty-state'
import { TablePagination } from '~/components/table-pagination'

import { MOVEMENT_TAB_TRANSACTIONS } from '../../lib/constants'
import { TransactionsFilters } from './filters'

export type TransactionsTabProps = Extract<
	Route.ComponentProps['loaderData'],
	{ tab: typeof MOVEMENT_TAB_TRANSACTIONS }
>['transactions'] & {
	formData: Route.ComponentProps['loaderData']['formData']
}

export function TransactionsTab({
	transactions,
	pagination,
	filters,
	formData,
}: TransactionsTabProps) {
	const navigation = useNavigation()
	const { t, i18n } = useTranslation(['transactions', 'constants'])

	const isDeleting =
		(navigation.formMethod === 'POST' &&
			navigation.state === 'submitting' &&
			navigation.formData?.get('intent') === 'delete' &&
			navigation.formAction?.startsWith(`/app/movements/transactions/`)) ??
		false

	const deletingId = navigation.formAction?.split('/').pop()

	const isLoading =
		navigation.state === 'loading' &&
		navigation.location &&
		navigation.location.search

	const hasFilters = Object.values(filters).some(Boolean)

	return (
		<div className='flex flex-col gap-4'>
			<TransactionsFilters
				filters={filters}
				selectData={formData.selectData}
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
								{transactions.map(transaction => {
									const {
										id,
										date,
										type,
										amount,
										currency,
										account,
										accountType,
										category,
									} = transaction
									const symbol = getCurrencySymbol(currency)
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
														currency={currency}
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
													type='transaction'
													variant='icon-text'
													size='xs'
													transactionType={type}
												/>
											</TableCell>
											<TableCell className='text-muted-foreground'>
												{t(
													`constants:categories.${category}.name`,
												)}
											</TableCell>
											<TableCell className='text-right'>
												<div className='flex items-center justify-end gap-2'>
													<Form
														method='post'
														action={`/app/movements/transactions/${id}`}
													>
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
								})}
							</TableBody>
						</Table>
					</div>

					<ul className='flex flex-col gap-2 min-w-0 xl:hidden'>
						{transactions.map(transaction => {
							const {
								id,
								date,
								type,
								amount,
								currency,
								account,
								accountType,
								category,
							} = transaction
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
											<Form
												method='post'
												action={`/app/movements/${MOVEMENT_TAB_TRANSACTIONS}/${id}`}
											>
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
											type='transaction'
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
											{getCurrencySymbol(currency)}{' '}
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
						})}
					</ul>
				</>
			)}

			<TablePagination page={pagination.page} pages={pagination.pages} />
		</div>
	)
}
