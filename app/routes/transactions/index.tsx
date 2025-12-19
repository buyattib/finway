import { Link, Form, data, useNavigation } from 'react-router'
import { PlusIcon, SquarePenIcon, TrashIcon } from 'lucide-react'
import { parseWithZod } from '@conform-to/zod/v4'
import { eq, desc, sql } from 'drizzle-orm'

import type { Route } from './+types'

import {
	transaction as transactionTable,
	wallet as walletTable,
	account as accountTable,
	transactionCategory as transactionCategoryTable,
} from '~/database/schema'
import { dbContext, userContext } from '~/lib/context'
import { cn, formatDate, formatNumber } from '~/lib/utils'

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

import { CURRENCY_DISPLAY } from '~/routes/accounts/lib/constants'

import {
	TRANSACTION_TYPE_DISPLAY,
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
} from './lib/constants'
import { DeleteTransactionFormSchema } from './lib/schemas'
import { createToastHeaders } from '~/utils-server/toast.server'
import { Spinner } from '~/components/ui/spinner'

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

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const transactions = await db
		.select({
			id: transactionTable.id,
			date: transactionTable.date,
			amount: sql<string>`CAST(${transactionTable.amount} / 100 as TEXT)`,
			type: transactionTable.type,
			currency: walletTable.currency,
			account: accountTable.name,
			transactionCategory: transactionCategoryTable.name,
		})
		.from(transactionTable)
		.innerJoin(
			transactionCategoryTable,
			eq(
				transactionCategoryTable.id,
				transactionTable.transactionCategoryId,
			),
		)
		.innerJoin(walletTable, eq(transactionTable.walletId, walletTable.id))
		.innerJoin(accountTable, eq(walletTable.accountId, accountTable.id))
		.where(eq(accountTable.ownerId, user.id))
		.orderBy(desc(transactionTable.date))

	return { transactions }
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
		columns: { id: true },
		with: {
			wallet: {
				columns: {},
				with: {
					account: {
						columns: { ownerId: true },
					},
				},
			},
		},
	})
	if (!transaction || transaction.wallet.account.ownerId !== user.id) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: `Transaction ${transactionId} not found`,
		})
		return data({}, { headers: toastHeaders })
	}

	await db.transaction(async tx => {
		const transaction = (await tx.query.transaction.findFirst({
			where: (transaction, { eq }) => eq(transaction.id, transactionId),
			columns: { amount: true, type: true },
			with: {
				wallet: {
					columns: {
						id: true,
						balance: true,
					},
				},
			},
		}))!

		const updatedBalance =
			transaction.wallet.balance +
			{
				[TRANSACTION_TYPE_EXPENSE]: transaction.amount,
				[TRANSACTION_TYPE_INCOME]: -transaction.amount,
			}[transaction.type]

		await tx
			.update(walletTable)
			.set({ balance: updatedBalance })
			.where(eq(walletTable.id, transaction.wallet.id))

		await tx
			.delete(transactionTable)
			.where(eq(transactionTable.id, transactionId))
	})

	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: 'Transaction deleted',
	})
	return data({}, { headers: toastHeaders })
}

export default function Transactions({
	loaderData: { transactions },
}: Route.ComponentProps) {
	const navigation = useNavigation()

	const isDeleting =
		navigation.formMethod === 'POST' &&
		navigation.formAction === `/app/transactions?index` &&
		navigation.state === 'submitting' &&
		navigation.formData?.get('intent') === 'delete'

	const deletingId = navigation.formData?.get('transactionId')

	return (
		<section
			className='flex flex-col gap-4'
			aria-labelledby='accounts-section'
		>
			<div className='flex items-center justify-between'>
				<Title id='accounts-section' level='h3'>
					Transactions
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

			<Table>
				{transactions.length === 0 && (
					<TableCaption>
						<Text size='md' weight='medium' alignment='center'>
							You have not created any transactions yet. Start
							creating them{' '}
							<Link to='create' className='text-primary'>
								here
							</Link>
						</Text>
					</TableCaption>
				)}
				{transactions.length !== 0 && (
					<TableHeader>
						<TableRow>
							<TableHead>Date</TableHead>
							<TableHead className='text-center'>Type</TableHead>
							<TableHead className='text-center'>
								Category
							</TableHead>
							<TableHead className='text-center'>
								Amount
							</TableHead>
							<TableHead className='text-center'>
								Account
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
							transactionCategory,
						}) => {
							const { symbol } = CURRENCY_DISPLAY[currency]
							const { label: typeLabel, color: typeColor } =
								TRANSACTION_TYPE_DISPLAY[type]

							return (
								<TableRow key={id}>
									<TableCell className='w-30'>
										{formatDate(new Date(date))}
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
										{transactionCategory}
									</TableCell>
									<TableCell className='text-center'>
										{symbol} {formatNumber(amount)}
									</TableCell>
									<TableCell className='text-center'>
										{account}
									</TableCell>
									<TableCell className='flex justify-end items-center gap-2'>
										<Button
											asChild
											size='icon-xs'
											variant='ghost'
											disabled={isDeleting}
										>
											<Link to='edit'>
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
		</section>
	)
}
