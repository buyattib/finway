import { Link, Form, useNavigation, data, useLocation } from 'react-router'
import { ArrowRightIcon, ArrowRightLeftIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { eq, and, desc, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import { parseWithZod } from '@conform-to/zod/v4'
import { useTranslation } from 'react-i18next'

import type { Route } from './+types'

import {
	currency as currencyTable,
	account as accountTable,
	transfer as transferTable,
} from '~/database/schema'
import { createToastHeaders } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { formatDate, formatNumber, getCurrencySymbol } from '~/lib/utils'
import { getBalances } from '~/lib/queries'
import { PAGE_SIZE } from '~/lib/constants'

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
import { Spinner } from '~/components/ui/spinner'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'
import { TablePagination } from '~/components/table-pagination'
import { EmptyState } from '~/components/empty-state'

import { DeleteTransferFormSchema } from './lib/schemas'

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
	const t = getServerT(context, 'transfers')

	const url = new URL(request.url)
	const page = Number(url.searchParams.get('page') ?? '1')

	const fromAccountAlias = alias(accountTable, 'fromAccount')
	const toAccountAlias = alias(accountTable, 'toAccount')

	const query = db
		.select({
			id: transferTable.id,

			date: transferTable.date,
			amount: sql<string>`CAST(${transferTable.amount} / 100.0 as TEXT)`,
			currency: currencyTable.code,

			fromAccount: fromAccountAlias.name,
			fromAccountType: fromAccountAlias.accountType,

			toAccount: toAccountAlias.name,
			toAccountType: toAccountAlias.accountType,
		})
		.from(transferTable)
		.innerJoin(
			currencyTable,
			eq(transferTable.currencyId, currencyTable.id),
		)
		.innerJoin(
			fromAccountAlias,
			eq(transferTable.fromAccountId, fromAccountAlias.id),
		)
		.innerJoin(
			toAccountAlias,
			eq(transferTable.toAccountId, toAccountAlias.id),
		)
		.where(
			and(
				eq(fromAccountAlias.ownerId, user.id),
				eq(toAccountAlias.ownerId, user.id),
			),
		)
		.orderBy(desc(transferTable.date), desc(transferTable.createdAt))

	const total = await db.$count(query)
	const transfers = await query
		.limit(PAGE_SIZE)
		.offset((page - 1) * PAGE_SIZE)

	return {
		transfers,
		pagination: { page, pages: Math.ceil(total / PAGE_SIZE), total },
		meta: {
			title: t('index.meta.title'),
			description: t('index.meta.description'),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'transfers')

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: DeleteTransferFormSchema,
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

	const { transferId } = submission.value

	const transfer = await db.query.transfer.findFirst({
		where: (transfer, { eq }) => eq(transfer.id, transferId),
		columns: {
			id: true,
			toAccountId: true,
			currencyId: true,
			amount: true,
		},
		with: {
			fromAccount: { columns: { ownerId: true } },
			toAccount: { columns: { ownerId: true } },
		},
	})
	if (
		!transfer ||
		(transfer.fromAccount && transfer.fromAccount.ownerId !== user.id) ||
		(transfer.toAccount && transfer.toAccount.ownerId !== user.id)
	) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: t('index.action.notFoundError', { transferId }),
		})
		return data({}, { headers: toastHeaders })
	}

	const { toAccountId: accountId, currencyId } = transfer
	const [{ balance }] = await getBalances({
		db,
		ownerId: user.id,
		accountId,
		currencyId,
		parseBalance: false,
	})
	if (balance < transfer.amount) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: t('index.action.negativeBalanceError'),
		})
		return data({}, { headers: toastHeaders })
	}

	await db.delete(transferTable).where(eq(transferTable.id, transferId))

	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: t('index.action.successToast'),
	})
	return data({}, { headers: toastHeaders })
}

export default function Transfers({
	loaderData: { transfers, pagination },
}: Route.ComponentProps) {
	const location = useLocation()
	const navigation = useNavigation()
	const { t } = useTranslation('transfers')

	const isDeleting =
		navigation.formMethod === 'POST' &&
		navigation.formAction === location.pathname + '?index' &&
		navigation.state === 'submitting' &&
		navigation.formData?.get('intent') === 'delete'

	const deletingId = navigation.formData?.get('transferId')

	return (
		<PageSection id='transfers-section'>
			<PageHeader>
				<Title id='transfers-section' level='h3'>
					{t('index.title')}
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
							{t('index.addTransferLabel')}
						</span>
					</Link>
				</Button>
			</PageHeader>

			<PageContent>
				{transfers.length === 0 && (
					<EmptyState
						icon={ArrowRightLeftIcon}
						title={t('index.emptyTitle')}
						action={
							<Button asChild>
								<Link to='create'>
									<PlusIcon />
									{t('index.addTransferLabel')}
								</Link>
							</Button>
						}
					/>
				)}

				{transfers.length > 0 && (
					<>
						{/* Desktop table view */}
						<div className='hidden xl:block'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t('index.table.date')}</TableHead>
										<TableHead>{t('index.table.fromAccount')}</TableHead>
										<TableHead>{t('index.table.toAccount')}</TableHead>
										<TableHead>{t('index.table.amount')}</TableHead>
										<TableHead className='text-right'>{t('index.table.actions')}</TableHead>
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
											const symbol = getCurrencySymbol(currency)
											return (
												<TableRow key={id}>
													<TableCell className='text-muted-foreground'>
														{formatDate(new Date(date))}
													</TableCell>
													<TableCell>
														<div className='flex items-center gap-2'>
															<AccountTypeIcon
																size='xs'
																accountType={fromAccountType}
															/>
															{fromAccount}
														</div>
													</TableCell>
													<TableCell>
														<div className='flex items-center gap-2'>
															<AccountTypeIcon
																size='xs'
																accountType={toAccountType}
															/>
															{toAccount}
														</div>
													</TableCell>
													<TableCell>
														<span className='flex items-center gap-2 font-semibold'>
															<CurrencyIcon
																currency={currency}
																size='sm'
															/>
															{symbol} {formatNumber(amount)}
														</span>
													</TableCell>
													<TableCell className='text-right'>
														<Form method='post'>
															<input
																type='hidden'
																name='transferId'
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
									return (
										<li
											key={id}
											className='flex flex-col gap-3 border rounded-xl p-4'
										>
											<div className='flex items-center justify-between'>
												<Text size='sm' theme='muted'>
													{formatDate(new Date(date))}
												</Text>
												<Form method='post'>
													<input
														type='hidden'
														name='transferId'
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
														{getCurrencySymbol(currency)} {formatNumber(amount)}
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
