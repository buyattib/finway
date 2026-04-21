import { Form, useNavigation } from 'react-router'
import { ArrowRightIcon, ArrowRightLeftIcon, TrashIcon } from 'lucide-react'
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
import { EmptyState } from '~/components/empty-state'
import { TablePagination } from '~/components/table-pagination'

import { MOVEMENT_TAB_TRANSFERS } from '../../lib/constants'
import { TransfersFilters } from './filters'

export type TransfersTabProps = Extract<
	Route.ComponentProps['loaderData'],
	{ tab: typeof MOVEMENT_TAB_TRANSFERS }
>['transfers'] & {
	formData: Route.ComponentProps['loaderData']['formData']
}

export function TransfersTab({
	transfers,
	pagination,
	filters,
	formData,
}: TransfersTabProps) {
	const navigation = useNavigation()
	const { t, i18n } = useTranslation('transfers')

	const isDeleting =
		navigation.formMethod === 'POST' &&
		navigation.state === 'submitting' &&
		navigation.formData?.get('intent') === 'delete' &&
		navigation.formAction?.startsWith(`/app/movements/transfers/`)

	const deletingId = navigation.formAction?.split('/').pop()

	const isLoading =
		navigation.state === 'loading' &&
		navigation.location &&
		navigation.location.search

	const hasFilters = Object.values(filters).some(Boolean)

	return (
		<div className='flex flex-col gap-4'>
			<TransfersFilters
				filters={filters}
				selectData={formData.selectData}
			/>

			<div className='h-6'>
				{isLoading && <Spinner size='md' className='mx-auto' />}
			</div>

			{transfers.length === 0 && (
				<EmptyState
					icon={ArrowRightLeftIcon}
					title={
						hasFilters
							? t('index.emptyFilteredMessage')
							: t('index.emptyTitle')
					}
				/>
			)}

			{transfers.length > 0 && (
				<>
					<div className='hidden xl:block'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										{t('index.table.date')}
									</TableHead>
									<TableHead>
										{t('index.table.fromAccount')}
									</TableHead>
									<TableHead>
										{t('index.table.toAccount')}
									</TableHead>
									<TableHead>
										{t('index.table.amount')}
									</TableHead>
									<TableHead className='text-right'>
										{t('index.table.actions')}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{transfers.map(
									({
										id,
										date,
										amount,
										currency,
										fromAccount,
										fromAccountType,
										toAccount,
										toAccountType,
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
																fromAccountType
															}
														/>
														{fromAccount}
													</div>
												</TableCell>
												<TableCell>
													<div className='flex items-center gap-2'>
														<AccountTypeIcon
															size='xs'
															accountType={
																toAccountType
															}
														/>
														{toAccount}
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
												<TableCell className='text-right'>
													<Form
														method='post'
														action={`/app/movements/transfers/${id}`}
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
												</TableCell>
											</TableRow>
										)
									},
								)}
							</TableBody>
						</Table>
					</div>

					<ul className='flex flex-col gap-2 min-w-0 xl:hidden'>
						{transfers.map(
							({
								id,
								date,
								amount,
								currency,
								fromAccount,
								fromAccountType,
								toAccount,
								toAccountType,
							}) => (
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
										<Form
											method='post'
											action={`/app/movements/transfers/${id}`}
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
													<TrashIcon aria-hidden />
												)}
												<span className='sr-only'>
													{t('index.deleteAriaLabel')}
												</span>
											</Button>
										</Form>
									</div>
									<div className='flex items-center justify-between'>
										<div className='flex items-center gap-2'>
											<AccountTypeIcon
												size='xs'
												accountType={fromAccountType}
											/>
											<Text size='sm'>{fromAccount}</Text>
										</div>
										<div className='flex flex-col items-center gap-1'>
											<Text
												weight='semi'
												className='flex items-center gap-1'
												size='xs'
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
											<ArrowRightIcon className='size-4 text-muted-foreground' />
										</div>
										<div className='flex items-center gap-2'>
											<AccountTypeIcon
												size='xs'
												accountType={toAccountType}
											/>
											<Text size='sm'>{toAccount}</Text>
										</div>
									</div>
								</li>
							),
						)}
					</ul>
				</>
			)}

			<TablePagination page={pagination.page} pages={pagination.pages} />
		</div>
	)
}
