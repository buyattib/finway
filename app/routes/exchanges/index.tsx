import { Link, Form, useNavigation, data } from 'react-router'
import { PlusIcon, TrashIcon } from 'lucide-react'
import { eq, desc, sql } from 'drizzle-orm'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types'

import {
	account as accountTable,
	exchange as exchangeTable,
	wallet as walletTable,
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

import { DeleteExchangeFormSchema } from './lib/schemas'

export function meta() {
	return [
		{ title: 'Exchanges | Finhub' },

		{
			property: 'og:title',
			content: 'Exchanges | Finhub',
		},
		{
			name: 'description',
			content: 'Your currency exchanges',
		},
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const exchanges = await db
		.select({
			id: exchangeTable.id,
			date: exchangeTable.date,
			fromCurrency: exchangeTable.fromCurrency,
			toCurrency: exchangeTable.toCurrency,
			fromAmount: sql<string>`CAST(${exchangeTable.fromAmount} / 100.0 as TEXT)`,
			toAmount: sql<string>`CAST(${exchangeTable.toAmount} / 100.0 as TEXT)`,
			account: accountTable.name,
		})
		.from(exchangeTable)
		.innerJoin(accountTable, eq(exchangeTable.accountId, accountTable.id))
		.where(eq(accountTable.ownerId, user.id))
		.orderBy(desc(exchangeTable.date))

	return { exchanges }
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
		columns: { id: true },
		with: {
			account: { columns: { ownerId: true } },
		},
	})
	if (!exchange || exchange.account.ownerId !== user.id) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: `Exchange ${exchangeId} not found`,
		})
		return data({}, { headers: toastHeaders })
	}

	await db.transaction(async tx => {
		const exchange = (await tx.query.exchange.findFirst({
			where: (exchange, { eq }) => eq(exchange.id, exchangeId),
			columns: {
				fromCurrency: true,
				toCurrency: true,
				fromAmount: true,
				toAmount: true,
			},
			with: {
				account: {
					columns: {},
					with: {
						wallets: {
							columns: {
								id: true,
								balance: true,
								currency: true,
							},
						},
					},
				},
			},
		}))!

		const fromWallet = exchange.account.wallets.find(
			w => w.currency === exchange.fromCurrency,
		)
		const toWallet = exchange.account.wallets.find(
			w => w.currency === exchange.toCurrency,
		)

		if (fromWallet) {
			await tx
				.update(walletTable)
				.set({ balance: fromWallet.balance + exchange.fromAmount })
				.where(eq(walletTable.id, fromWallet.id))
		}
		if (toWallet) {
			await tx
				.update(walletTable)
				.set({ balance: toWallet.balance - exchange.toAmount })
				.where(eq(walletTable.id, toWallet.id))
		}

		await tx.delete(exchangeTable).where(eq(exchangeTable.id, exchangeId))
	})

	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: 'Exchange deleted',
	})
	return data({}, { headers: toastHeaders })
}

export default function Exchanges({
	loaderData: { exchanges },
}: Route.ComponentProps) {
	const navigation = useNavigation()

	const isDeleting =
		navigation.formMethod === 'POST' &&
		navigation.formAction === `/app/exchanges?index` &&
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
							<TableHead className='text-center'>
								Account
							</TableHead>
							<TableHead className='text-center'>From</TableHead>
							<TableHead className='text-center'>To</TableHead>
							<TableHead className='text-center'>Rate</TableHead>
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
						}) => {
							return (
								<TableRow key={id}>
									<TableCell className='w-30'>
										{formatDate(new Date(date))}
									</TableCell>
									<TableCell className='text-center'>
										{account}
									</TableCell>
									<TableCell className='text-center'>
										<b>{fromCurrency}</b>{' '}
										{formatNumber(fromAmount)}
									</TableCell>
									<TableCell className='text-center'>
										<b>{toCurrency}</b>{' '}
										{formatNumber(toAmount)}
									</TableCell>
									<TableCell className='text-center'>
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
		</section>
	)
}
