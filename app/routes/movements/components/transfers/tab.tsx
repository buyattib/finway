import { Link, useNavigation, useSearchParams } from 'react-router'
import { ArrowRightIcon, ArrowRightLeftIcon, SquarePenIcon } from 'lucide-react'
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
import { DeleteButton } from '../delete-button'
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
	const [searchParams] = useSearchParams()
	const { t, i18n } = useTranslation('movements')

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
							? t('index.transfers.emptyFilteredMessage')
							: t('index.transfers.emptyTitle')
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
										{t('index.transfers.table.date')}
									</TableHead>
									<TableHead>
										{t('index.transfers.table.fromAccount')}
									</TableHead>
									<TableHead>
										{t('index.transfers.table.toAccount')}
									</TableHead>
									<TableHead>
										{t('index.transfers.table.amount')}
									</TableHead>
									<TableHead className='text-right'>
										{t('index.transfers.table.actions')}
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
													<div className='flex items-center justify-end gap-2'>
														<Button
															variant='ghost'
															size='icon-xs'
															asChild
														>
															<Link
																to={{
																	pathname: `/app/movements/transfers/${id}/edit`,
																	search: searchParams.toString(),
																}}
															>
																<SquarePenIcon
																	aria-hidden
																/>
																<span className='sr-only'>
																	{t(
																		'index.transfers.editAriaLabel',
																	)}
																</span>
															</Link>
														</Button>
														<DeleteButton
															movement={
																MOVEMENT_TAB_TRANSFERS
															}
															movementId={id}
															ariaLabel={t(
																'index.transfers.deleteAriaLabel',
															)}
														/>
													</div>
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
										<div className='flex items-center gap-2'>
											<Button
												variant='ghost'
												size='icon-xs'
												asChild
											>
												<Link
													to={{
														pathname: `/app/movements/transfers/${id}/edit`,
														search: searchParams.toString(),
													}}
												>
													<SquarePenIcon
														aria-hidden
													/>
													<span className='sr-only'>
														{t(
															'index.transfers.editAriaLabel',
														)}
													</span>
												</Link>
											</Button>
											<DeleteButton
												movement={
													MOVEMENT_TAB_TRANSFERS
												}
												movementId={id}
												ariaLabel={t(
													'index.transfers.deleteAriaLabel',
												)}
											/>
										</div>
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
