import { Link, Form, useNavigation, data, useLocation } from 'react-router'
import { PlusIcon, TrashIcon } from 'lucide-react'
import { eq, desc, sql } from 'drizzle-orm'
import { parseWithZod } from '@conform-to/zod/v4'
import { alias } from 'drizzle-orm/sqlite-core'

import type { Route } from './+types'

import {
	currency as currencyTable,
	account as accountTable,
	exchange as exchangeTable,
} from '~/database/schema'
import { dbContext, userContext } from '~/lib/context'
import { formatDate, formatNumber } from '~/lib/utils'
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
import { Spinner } from '~/components/ui/spinner'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { TablePagination } from '~/components/table-pagination'

import { getBalances } from '~/lib/queries'

import { DeleteExchangeFormSchema } from './lib/schemas'

export function meta() {
	return [
		{ title: 'Exchanges | Finway' },

		{
			property: 'og:title',
			content: 'Exchanges | Finway',
		},
		{
			name: 'description',
			content: 'Your currency exchanges',
		},
	]
}

const PAGE_SIZE = 20

export async function loader({ context, request }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const url = new URL(request.url)
	const page = Number(url.searchParams.get('page') ?? '1')

	const fromCurrencyAlias = alias(currencyTable, 'fromCurrency')
	const toCurrencyAlias = alias(currencyTable, 'toCurrency')

	const query = db
		.select({
			id: exchangeTable.id,
			date: exchangeTable.date,

			account: accountTable.name,
			accountType: accountTable.accountType,

			fromCurrency: fromCurrencyAlias.code,
			toCurrency: toCurrencyAlias.code,

			fromAmount: sql<string>`CAST(${exchangeTable.fromAmount} / 100.0 as TEXT)`,
			toAmount: sql<string>`CAST(${exchangeTable.toAmount} / 100.0 as TEXT)`,
		})
		.from(exchangeTable)
		.innerJoin(accountTable, eq(exchangeTable.accountId, accountTable.id))
		.innerJoin(
			fromCurrencyAlias,
			eq(exchangeTable.fromCurrencyId, fromCurrencyAlias.id),
		)
		.innerJoin(
			toCurrencyAlias,
			eq(exchangeTable.toCurrencyId, toCurrencyAlias.id),
		)
		.where(eq(accountTable.ownerId, user.id))
		.orderBy(desc(exchangeTable.date), desc(exchangeTable.createdAt))

	const total = await db.$count(query)
	const exchanges = await query
		.limit(PAGE_SIZE)
		.offset((page - 1) * PAGE_SIZE)

	return {
		exchanges,
		pagination: { page, pages: Math.ceil(total / PAGE_SIZE), total },
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: DeleteExchangeFormSchema,
	})

	if (submission.status !== 'success') {
		console.error(submission.reply())

		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: 'Could not delete exchange',
			description: 'Please try again',
		})
		return data({}, { headers: toastHeaders })
	}

	const { exchangeId } = submission.value

	const exchange = await db.query.exchange.findFirst({
		where: (exchange, { eq }) => eq(exchange.id, exchangeId),
		columns: {
			id: true,
			accountId: true,
			toCurrencyId: true,
			toAmount: true,
		},
		with: { account: { columns: { ownerId: true } } },
	})
	if (!exchange || exchange.account.ownerId !== user.id) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: `Exchange ${exchangeId} not found`,
		})
		return data({}, { headers: toastHeaders })
	}

	const { accountId, toCurrencyId: currencyId } = exchange
	const [{ balance }] = await getBalances({
		db,
		ownerId: user.id,
		accountId,
		currencyId,
		parseBalance: false,
	})
	if (balance < exchange.toAmount) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: 'Cannot delete exchange as account would hold a negative balance',
		})
		return data({}, { headers: toastHeaders })
	}

	await db.delete(exchangeTable).where(eq(exchangeTable.id, exchangeId))

	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: 'Exchange deleted',
	})
	return data({}, { headers: toastHeaders })
}

export default function Exchanges({
	loaderData: { exchanges, pagination },
}: Route.ComponentProps) {
	const location = useLocation()
	const navigation = useNavigation()

	const isDeleting =
		navigation.formMethod === 'POST' &&
		navigation.formAction === location.pathname + '?index' &&
		navigation.state === 'submitting' &&
		navigation.formData?.get('intent') === 'delete'

	const deletingId = navigation.formData?.get('exchangeId')

	return (
		<section
			className='flex flex-col gap-4'
			aria-labelledby='exchanges-section'
		>
			<div className='flex items-center justify-between'>
				<Title id='exchanges-section' level='h3'>
					Exchanges
				</Title>
				<Button
					asChild
					variant='default'
					autoFocus
					disabled={isDeleting}
				>
					<Link to='create' prefetch='intent'>
						<PlusIcon aria-hidden />
						<span className='sm:inline hidden'>Exchange</span>
					</Link>
				</Button>
			</div>

			<Table>
				{exchanges.length === 0 && (
					<TableCaption>
						<Text size='md' weight='medium' alignment='center'>
							You have not created any exchange yet. Start
							creating them{' '}
							<Link to='create' className='text-primary'>
								here
							</Link>
						</Text>
					</TableCaption>
				)}
				{exchanges.length !== 0 && (
					<TableHeader>
						<TableRow>
							<TableHead>Date</TableHead>
							<TableHead className='text-right'>
								Account
							</TableHead>
							<TableHead className='text-right'>From</TableHead>
							<TableHead className='text-right'>To</TableHead>
							<TableHead className='text-right'>Rate</TableHead>
							<TableHead></TableHead>
						</TableRow>
					</TableHeader>
				)}
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
							return (
								<TableRow key={id}>
									<TableCell className='w-30'>
										{formatDate(new Date(date))}
									</TableCell>
									<TableCell>
										<div className='flex justify-end items-center gap-2'>
											<AccountTypeIcon
												size='xs'
												accountType={accountType}
											/>
											{account}
										</div>
									</TableCell>
									<TableCell className='text-right'>
										<b>{fromCurrency}</b>{' '}
										{formatNumber(fromAmount)}
									</TableCell>
									<TableCell className='text-right'>
										<b>{toCurrency}</b>{' '}
										{formatNumber(toAmount)}
									</TableCell>
									<TableCell className='text-right'>
										{formatNumber(
											Number(fromAmount) /
												Number(toAmount),
										)}{' '}
										<b>
											{fromCurrency} / {toCurrency}
										</b>
									</TableCell>
									<TableCell className='flex justify-end items-center gap-2'>
										<Form method='post'>
											<input
												type='hidden'
												name='exchangeId'
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
													Delete exchange
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

			<TablePagination page={pagination.page} pages={pagination.pages} />
		</section>
	)
}
