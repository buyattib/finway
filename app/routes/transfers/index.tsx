import { Link, Form, useNavigation, data } from 'react-router'
import { PlusIcon, TrashIcon } from 'lucide-react'
import { eq, and, desc, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types'

import {
	transfer as transferTable,
	account as accountTable,
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

import { DeleteTransferFormSchema } from './lib/schemas'

export function meta() {
	return [
		{ title: 'Transfers | Finhub' },

		{
			property: 'og:title',
			content: 'Transfers | Finhub',
		},
		{
			name: 'description',
			content: 'Your transfers between accounts',
		},
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const fromAccountAlias = alias(accountTable, 'fromAccount')
	const toAccountAlias = alias(accountTable, 'toAccount')

	const transfers = await db
		.select({
			id: transferTable.id,

			date: transferTable.date,
			amount: sql<string>`CAST(${transferTable.amount} / 100.0 as TEXT)`,
			currency: transferTable.currency,

			fromAccount: fromAccountAlias.name,
			toAccount: toAccountAlias.name,
		})
		.from(transferTable)
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
		.orderBy(desc(transferTable.date))

	return { transfers }
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: DeleteTransferFormSchema,
	})

	if (submission.status !== 'success') {
		console.error(submission.reply())

		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: 'Could not delete transfer',
			description: 'Please try again',
		})
		return data({}, { headers: toastHeaders })
	}

	const { transferId } = submission.value

	const transfer = await db.query.transfer.findFirst({
		where: (transfer, { eq }) => eq(transfer.id, transferId),
		columns: { id: true },
		with: {
			fromAccount: { columns: { ownerId: true } },
			toAccount: { columns: { ownerId: true } },
		},
	})
	if (
		!transfer ||
		transfer.fromAccount.ownerId !== user.id ||
		transfer.toAccount.ownerId !== user.id
	) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: `Transfer ${transferId} not found`,
		})
		return data({}, { headers: toastHeaders })
	}

	await db.transaction(async tx => {
		const transfer = (await tx.query.transfer.findFirst({
			where: (transfer, { eq }) => eq(transfer.id, transferId),
			columns: { amount: true, currency: true },
			with: {
				fromAccount: {
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
				toAccount: {
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

		const fromWallet = transfer.fromAccount.wallets.find(
			w => w.currency === transfer.currency,
		)
		const toWallet = transfer.toAccount.wallets.find(
			w => w.currency === transfer.currency,
		)

		if (fromWallet) {
			await tx
				.update(walletTable)
				.set({ balance: fromWallet.balance + transfer.amount })
				.where(eq(walletTable.id, fromWallet.id))
		}
		if (toWallet) {
			await tx
				.update(walletTable)
				.set({ balance: toWallet.balance - transfer.amount })
				.where(eq(walletTable.id, toWallet.id))
		}

		await tx.delete(transferTable).where(eq(transferTable.id, transferId))
	})

	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: 'Transfer deleted',
	})
	return data({}, { headers: toastHeaders })
}

export default function Transfers({
	loaderData: { transfers },
}: Route.ComponentProps) {
	const navigation = useNavigation()

	const isDeleting =
		navigation.formMethod === 'POST' &&
		navigation.formAction === `/app/transfers?index` &&
		navigation.state === 'submitting' &&
		navigation.formData?.get('intent') === 'delete'

	const deletingId = navigation.formData?.get('transactionId')

	return (
		<section
			className='flex flex-col gap-4'
			aria-labelledby='transfers-section'
		>
			<div className='flex items-center justify-between'>
				<Title id='transfers-section' level='h3'>
					Transfers
				</Title>
				<Button
					asChild
					variant='default'
					autoFocus
					disabled={isDeleting}
				>
					<Link to='create' prefetch='intent'>
						<PlusIcon aria-hidden />
						<span className='sm:inline hidden'>Transfer</span>
					</Link>
				</Button>
			</div>

			<Table>
				{transfers.length === 0 && (
					<TableCaption>
						<Text size='md' weight='medium' alignment='center'>
							You have not created any transfer yet. Start
							creating them{' '}
							<Link to='create' className='text-primary'>
								here
							</Link>
						</Text>
					</TableCaption>
				)}
				{transfers.length !== 0 && (
					<TableHeader>
						<TableRow>
							<TableHead>Date</TableHead>
							<TableHead className='text-center'>
								Amount
							</TableHead>
							<TableHead className='text-center'>
								From Account
							</TableHead>
							<TableHead className='text-center'>
								To Account
							</TableHead>
							<TableHead></TableHead>
						</TableRow>
					</TableHeader>
				)}
				<TableBody>
					{transfers.map(
						({
							id,
							date,
							amount,
							currency,
							fromAccount,
							toAccount,
						}) => {
							return (
								<TableRow key={id}>
									<TableCell className='w-30'>
										{formatDate(new Date(date))}
									</TableCell>
									<TableCell className='text-center'>
										<b>{currency}</b> {formatNumber(amount)}
									</TableCell>
									<TableCell className='text-center'>
										{fromAccount}
									</TableCell>
									<TableCell className='text-center'>
										{toAccount}
									</TableCell>
									<TableCell className='flex justify-end items-center gap-2'>
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
													Delete transfer
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
