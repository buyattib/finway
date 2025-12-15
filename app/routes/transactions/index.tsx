import { Link } from 'react-router'
import { PlusIcon } from 'lucide-react'

import type { Route } from './+types'

import { dbContext, userContext } from '~/lib/context'
import { formatNumber } from '~/lib/utils'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { Title } from '~/components/ui/title'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table'

// import { ACCOUNT_TYPE_LABEL, CURRENCY_DISPLAY } from './lib/constants'
import { getUserTransactions } from './lib/queries'

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

	const transactions = await getUserTransactions(db, user.id)
	return { transactions }
}

export default function Transactions({ loaderData }: Route.ComponentProps) {
	const { transactions } = loaderData

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
							You have not created any transactions yet.
						</Text>
					</TableCaption>
				)}
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
				<TableBody>
					{transactions.map(tx => {
						return (
							<TableRow key={tx.id}>
								<TableCell>{tx.date}</TableCell>
								<TableCell>{tx.type}</TableCell>
								<TableCell>
									{tx.subAccount.currency} {tx.amount}
								</TableCell>
								<TableCell>
									{tx.subAccount.account.name}
								</TableCell>
								<TableCell>
									{tx.transactionCategory.name}
								</TableCell>
							</TableRow>
						)
					})}
				</TableBody>
			</Table>
		</section>
	)
}
