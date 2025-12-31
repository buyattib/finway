import { Link } from 'react-router'
import { PlusIcon } from 'lucide-react'
import { desc, eq, sql } from 'drizzle-orm'

import type { Route } from './+types'

import { dbContext, userContext } from '~/lib/context'
import {
	currency as currencyTable,
	account as accountTable,
	transaction as transactionTable,
} from '~/database/schema'
import { formatNumber } from '~/lib/utils'

import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { Title } from '~/components/ui/title'
import { AccountTypeIcon } from '~/components/account-type-icon'
import { CurrencyIcon } from '~/components/currency-icon'

import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
} from '~/routes/transactions/lib/constants'

import { ACCOUNT_TYPE_LABEL, CURRENCY_DISPLAY } from './lib/constants'
import type { TAccountBalance } from './lib/types'

export function meta() {
	return [
		{ title: 'Accounts | Finhub' },

		{
			property: 'og:title',
			content: 'Accounts | Finhub',
		},
		{
			name: 'description',
			content: 'Your accounts',
		},
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const balances = await db
		.select({
			accountId: transactionTable.accountId,
			currencyId: transactionTable.currencyId,
			currency: currencyTable.code,
			balance: sql<number>`SUM(
					CASE 
					WHEN ${transactionTable.type} = ${TRANSACTION_TYPE_INCOME} THEN ${transactionTable.amount}
					WHEN ${transactionTable.type} = ${TRANSACTION_TYPE_EXPENSE} THEN -${transactionTable.amount}
					ELSE 0
					END
				)`.as('balance'),
		})
		.from(transactionTable)
		.innerJoin(
			currencyTable,
			eq(currencyTable.id, transactionTable.currencyId),
		)
		.innerJoin(
			accountTable,
			eq(accountTable.id, transactionTable.accountId),
		)
		.where(eq(accountTable.ownerId, user.id))
		.groupBy(transactionTable.accountId, transactionTable.currencyId)
		.orderBy(transactionTable.accountId, desc(sql`balance`))

	const balancesByAccount = balances.reduce(
		(acc, curr) => {
			const balances = acc[curr.accountId] || []

			acc[curr.accountId] =
				balances.length < 3
					? [
							...balances,
							{
								id: `${curr.accountId}-${curr.currencyId}`,
								balance: String(curr.balance / 100),
								currency: curr.currency,
							},
						]
					: balances

			return acc
		},
		{} as Record<string, Array<TAccountBalance>>,
	)

	const accounts = await db
		.select({
			id: accountTable.id,
			name: accountTable.name,
			description: accountTable.description,
			accountType: accountTable.accountType,
		})
		.from(accountTable)
		.where(eq(accountTable.ownerId, user.id))
		.orderBy(desc(accountTable.createdAt))

	const accountsWithBalances = accounts.map(account => {
		return {
			...account,
			balances: (balancesByAccount[account.id] || []).slice(0, 3),
		}
	})

	return { accounts: accountsWithBalances }
}

export default function Accounts({
	loaderData: { accounts },
}: Route.ComponentProps) {
	return (
		<section
			className='flex flex-col gap-4'
			aria-labelledby='accounts-section'
		>
			<div className='flex items-center justify-between'>
				<Title id='accounts-section' level='h3'>
					Accounts
				</Title>
				<Button asChild variant='default' autoFocus>
					<Link to='create' prefetch='intent'>
						<PlusIcon aria-hidden />
						<span className='sm:inline hidden'>Account</span>
					</Link>
				</Button>
			</div>

			{accounts.length === 0 && (
				<div className='my-2'>
					<Text size='md' weight='medium' alignment='center'>
						You have not created any accounts yet. Start creating
						them{' '}
						<Link to='create' className='text-primary'>
							here
						</Link>
					</Text>
				</div>
			)}

			<ul className='flex flex-col gap-2'>
				{accounts.map(
					({ id, name, description, accountType, balances }) => (
						<li key={id}>
							<Link
								to={id}
								prefetch='intent'
								className='flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-center border rounded-xl p-4 sm:px-6 hover:border-primary transition-all min-h-32'
							>
								<div className='flex items-center gap-4'>
									<AccountTypeIcon
										accountType={accountType}
									/>
									<div className='flex flex-col sm:gap-2 gap-4'>
										<div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
											<Title id={id} level='h5'>
												{name}
											</Title>
											<Text size='sm' theme='primary'>
												{
													ACCOUNT_TYPE_LABEL[
														accountType
													]
												}
											</Text>
										</div>
										{description && (
											<Text size='sm' theme='muted'>
												{description}
											</Text>
										)}
									</div>
								</div>
								{!!balances.length && (
									<ul
										className='flex flex-col justify-center gap-2 min-w-5xs'
										aria-labelledby={id}
									>
										{balances.map(
											({
												id: bId,
												balance,
												currency,
											}) => {
												const { symbol } =
													CURRENCY_DISPLAY[currency]
												return (
													<li
														key={bId}
														className='flex items-center justify-between gap-4'
													>
														<Text>
															{`${symbol} ${formatNumber(balance)}`}
														</Text>
														<Text className='flex items-center gap-2'>
															<CurrencyIcon
																currency={
																	currency
																}
																size='sm'
															/>
															{currency}
														</Text>
													</li>
												)
											},
										)}
									</ul>
								)}
							</Link>
						</li>
					),
				)}
			</ul>
		</section>
	)
}
