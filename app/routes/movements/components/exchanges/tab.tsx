import { Form, Link, useNavigation, useSearchParams } from 'react-router'
import { RefreshCwIcon, SquarePenIcon, TrashIcon } from 'lucide-react'
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

import { calculateRate } from '~/routes/exchanges/lib/utils'

import { MOVEMENT_TAB_EXCHANGES } from '../../lib/constants'
import { ExchangesFilters } from './filters'

export type ExchangesTabProps = Extract<
	Route.ComponentProps['loaderData'],
	{ tab: typeof MOVEMENT_TAB_EXCHANGES }
>['exchanges'] & {
	formData: Route.ComponentProps['loaderData']['formData']
}

export function ExchangesTab({
	exchanges,
	pagination,
	filters,
	formData,
}: ExchangesTabProps) {
	const navigation = useNavigation()
	const [searchParams] = useSearchParams()
	const { t, i18n } = useTranslation('exchanges')

	const isDeleting =
		navigation.formMethod === 'POST' &&
		navigation.state === 'submitting' &&
		navigation.formData?.get('intent') === 'delete' &&
		navigation.formAction?.startsWith(`/app/movements/exchanges/`)

	const deletingId = navigation.formAction?.split('/').pop()

	const isLoading =
		navigation.state === 'loading' &&
		navigation.location &&
		navigation.location.search

	const hasFilters = Object.values(filters).some(Boolean)

	return (
		<div className='flex flex-col gap-4'>
			<ExchangesFilters
				filters={filters}
				selectData={formData.selectData}
			/>

			<div className='h-6'>
				{isLoading && <Spinner size='md' className='mx-auto' />}
			</div>

			{exchanges.length === 0 && (
				<EmptyState
					icon={RefreshCwIcon}
					title={
						hasFilters
							? t('index.emptyFilteredMessage')
							: t('index.emptyTitle')
					}
				/>
			)}

			{exchanges.length > 0 && (
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
										{t('index.table.from')}
									</TableHead>
									<TableHead>{t('index.table.to')}</TableHead>
									<TableHead>
										{t('index.table.rate')}
									</TableHead>
									<TableHead className='text-right'>
										{t('index.table.actions')}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{exchanges.map(
									({
										id,
										date,
										fromAmount,
										toAmount,
										fromCurrency,
										toCurrency,
										account,
										accountType,
									}) => {
										const fromSymbol =
											getCurrencySymbol(fromCurrency)
										const toSymbol =
											getCurrencySymbol(toCurrency)

										const rate = calculateRate({
											fromAmount,
											toAmount,
											fromCurrency,
											toCurrency,
											locale: i18n.language,
										})

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
																fromCurrency
															}
															size='sm'
														/>
														{fromSymbol}{' '}
														{formatNumber(
															fromAmount,
															i18n.language,
														)}
													</span>
												</TableCell>
												<TableCell>
													<span className='flex items-center gap-2 font-semibold text-foreground'>
														<CurrencyIcon
															currency={
																toCurrency
															}
															size='sm'
														/>
														{toSymbol}{' '}
														{formatNumber(
															toAmount,
															i18n.language,
														)}
													</span>
												</TableCell>
												<TableCell className='text-muted-foreground'>
													{rate}
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
																	pathname: `/app/movements/exchanges/${id}/edit`,
																	search: searchParams.toString(),
																}}
															>
																<SquarePenIcon
																	aria-hidden
																/>
																<span className='sr-only'>
																	{t(
																		'index.editAriaLabel',
																	)}
																</span>
															</Link>
														</Button>
														<Form
															method='post'
															action={`/app/movements/exchanges/${id}`}
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
									},
								)}
							</TableBody>
						</Table>
					</div>

					<ul className='flex flex-col gap-2 min-w-0 xl:hidden'>
						{exchanges.map(
							({
								id,
								date,
								fromAmount,
								toAmount,
								fromCurrency,
								toCurrency,
								account,
								accountType,
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
														pathname: `/app/movements/exchanges/${id}/edit`,
														search: searchParams.toString(),
													}}
												>
													<SquarePenIcon
														aria-hidden
													/>
													<span className='sr-only'>
														{t(
															'index.editAriaLabel',
														)}
													</span>
												</Link>
											</Button>
											<Form
												method='post'
												action={`/app/movements/exchanges/${id}`}
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
										<Text
											weight='semi'
											className='flex items-center gap-2'
											size='sm'
										>
											<CurrencyIcon
												currency={fromCurrency}
												size='sm'
											/>
											{getCurrencySymbol(fromCurrency)}{' '}
											{formatNumber(
												fromAmount,
												i18n.language,
											)}
										</Text>
										<RefreshCwIcon className='size-4 text-muted-foreground shrink-0' />
										<Text
											weight='semi'
											className='flex items-center gap-2'
											size='sm'
										>
											<CurrencyIcon
												currency={toCurrency}
												size='sm'
											/>
											{getCurrencySymbol(toCurrency)}{' '}
											{formatNumber(
												toAmount,
												i18n.language,
											)}
										</Text>
									</div>
									<Text size='xs' theme='muted'>
										{t('index.table.rate')}:{' '}
										{calculateRate({
											fromAmount,
											toAmount,
											fromCurrency,
											toCurrency,
											locale: i18n.language,
										})}
									</Text>
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
