import { Link } from 'react-router'
import { PlusIcon } from 'lucide-react'

import type { Route } from './+types'

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

import { TRANSACTION_TYPE_DISPLAY } from './lib/constants'

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

	const result = await db.query.transaction.findMany({
		orderBy: (transaction, { desc }) => [desc(transaction.date)],
		where: (transaction, { eq }) => eq(transaction.ownerId, user.id),
		columns: { id: true, date: true, amount: true, type: true },
		with: {
			wallet: {
				columns: { id: true, currency: true },
				with: {
					account: {
						columns: { id: true, name: true },
					},
				},
			},
			transactionCategory: {
				columns: { id: true, name: true },
			},
		},
	})

	const transactions = result.map(tx => ({
		...tx,
		amount: String(tx.amount / 100),
	}))

	return { transactions }
}

export default function Transactions({
	loaderData: { transactions },
}: Route.ComponentProps) {
	return (
		<section
			className='flex flex-col gap-4'
			aria-labelledby='accounts-section'
		>
			<div className='flex items-center justify-between'>
				<Title id='accounts-section' level='h3'>
					Transactions
				</Title>
				<Button asChild variant='default' autoFocus>
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
							<TableHead>Type</TableHead>
							<TableHead>Amount</TableHead>
							<TableHead>Account</TableHead>
							<TableHead>Category</TableHead>
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
							wallet,
							transactionCategory,
						}) => {
							const { symbol } = CURRENCY_DISPLAY[wallet.currency]
							const { label: typeLabel, color: typeColor } =
								TRANSACTION_TYPE_DISPLAY[type]

							return (
								<TableRow key={id}>
									<TableCell>
										{formatDate(new Date(date))}
									</TableCell>
									<TableCell
										className={cn(`text-${typeColor}`)}
									>
										{typeLabel}
									</TableCell>
									<TableCell>
										{symbol} {formatNumber(amount)}
									</TableCell>
									<TableCell>{wallet.account.name}</TableCell>
									<TableCell>
										{transactionCategory.name}
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
