import { and, desc, eq, like, ne, sql } from 'drizzle-orm'

import * as schema from '~/database/schema'
import { getBalances } from '~/lib/queries'
import type { DB } from '~/lib/types'

import type { TAccountType, TBalanceByAccount } from './types'
import { ACCOUNT_TYPE_CREDIT_CARD } from './constants'

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
	const filters = [
		eq(schema.account.ownerId, ownerId),
		ne(schema.account.accountType, ACCOUNT_TYPE_CREDIT_CARD),
	]
	if (search) {
		filters.push(
			like(
				sql`lower(${schema.account.name})`,
				`%${search.toLowerCase()}%`,
			),
		)
	}

	const accounts = await db
		.select({
			id: schema.account.id,
			name: schema.account.name,
			description: schema.account.description,
			accountType: schema.account.accountType,
		})
		.from(schema.account)
		.where(and(...filters))
		.orderBy(desc(schema.account.createdAt))

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
		eq(schema.account.ownerId, ownerId),
		eq(schema.account.name, name),
		eq(schema.account.accountType, accountType),
	]
	if (excludeId) {
		filters.push(ne(schema.account.id, excludeId))
	}

	return db.$count(schema.account, and(...filters))
}

// mutations --------

export async function deleteAccount({
	db,
	accountId,
}: {
	db: DB
	accountId: string
}) {
	await db.delete(schema.account).where(eq(schema.account.id, accountId))
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
		.insert(schema.account)
		.values({ name, accountType, description, ownerId })
		.returning({ id: schema.account.id })

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
		.update(schema.account)
		.set({ name, accountType, description })
		.where(eq(schema.account.id, id))
}
