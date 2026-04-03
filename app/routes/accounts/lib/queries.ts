import { and, desc, eq, like, sql } from 'drizzle-orm'

import { account as accountTable } from '~/database/schema'
import { getBalances } from '~/lib/queries'
import type { DB } from '~/lib/types'

import type { TBalanceByAccount } from './types'

export async function getBalancesByAccount({
	db,
	ownerId,
}: {
	db: DB
	ownerId: string
}) {
	const balances = await getBalances({ db, ownerId })

	const balancesByAccount = balances.reduce(
		(acc, { accountId, currencyId, currency, balance }) => {
			acc[accountId] = acc[accountId] || []
			acc[accountId].push({
				id: `${accountId}-${currencyId}`,
				currency,
				balance,
			})
			return acc
		},
		{} as TBalanceByAccount,
	)

	return balancesByAccount
}

export async function getUserAccounts({
	db,
	userId,
	search,
}: {
	db: DB
	userId: string
	search: string | null
}) {
	const filters = [eq(accountTable.ownerId, userId)]
	if (search) {
		filters.push(
			like(sql`lower(${accountTable.name})`, `%${search.toLowerCase()}%`),
		)
	}

	const accounts = await db
		.select({
			id: accountTable.id,
			name: accountTable.name,
			description: accountTable.description,
			accountType: accountTable.accountType,
		})
		.from(accountTable)
		.where(and(...filters))
		.orderBy(desc(accountTable.createdAt))

	return accounts
}
