import { and, desc, eq, like, ne, sql } from 'drizzle-orm'

import { account as accountTable } from '~/database/schema'
import { getBalances } from '~/lib/queries'
import type { DB } from '~/lib/types'

import type { TAccountType, TBalanceByAccount } from './types'

// fetch --------

export async function getAccountById({
	db,
	accountId,
}: {
	db: DB
	accountId: string
}) {
	const account = await db.query.account.findFirst({
		where: (account, { eq }) => eq(account.id, accountId),
		columns: {
			id: true,
			name: true,
			description: true,
			accountType: true,
			ownerId: true,
		},
	})

	return account
}

export async function getAccounts({
	db,
	ownerId,
	search,
}: {
	db: DB
	ownerId: string
	search: string | null
}) {
	const filters = [eq(accountTable.ownerId, ownerId)]
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

export async function getDuplicateAccountCount({
	db,
	ownerId,
	name,
	accountType,
	excludeId,
}: {
	db: DB
	ownerId: string
	name: string
	accountType: TAccountType
	excludeId?: string
}) {
	const filters = [
		eq(accountTable.ownerId, ownerId),
		eq(accountTable.name, name),
		eq(accountTable.accountType, accountType),
	]
	if (excludeId) {
		filters.push(ne(accountTable.id, excludeId))
	}

	return db.$count(accountTable, and(...filters))
}

// mutations --------

export async function deleteAccount({
	db,
	accountId,
}: {
	db: DB
	accountId: string
}) {
	await db.delete(accountTable).where(eq(accountTable.id, accountId))
}

export async function createAccount({
	db,
	ownerId,
	name,
	accountType,
	description,
}: {
	db: DB
	ownerId: string
	name: string
	accountType: TAccountType
	description: string
}) {
	const [{ id }] = await db
		.insert(accountTable)
		.values({ name, accountType, description, ownerId })
		.returning({ id: accountTable.id })

	return id
}

export async function updateAccount({
	db,
	id,
	name,
	accountType,
	description,
}: {
	db: DB
	id: string
	name: string
	accountType: TAccountType
	description: string
}) {
	await db
		.update(accountTable)
		.set({ name, accountType, description })
		.where(eq(accountTable.id, id))
}
