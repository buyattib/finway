import { and, desc, eq, ne, sql } from 'drizzle-orm'

import * as schema from '~/database/schema'

import { getBalances } from '~/lib/queries'
import { PAGE_SIZE } from '~/lib/constants'
import type { DB } from '~/lib/types'

import { ACCOUNT_TYPE_CREDIT_CARD } from '~/routes/accounts/lib/constants'

import type { TCategory, TTransactionType } from './types'

// fetch --------

export async function getTransactionById({
	db,
	transactionId,
}: {
	db: DB
	transactionId: string
}) {
	return db.query.transaction.findFirst({
		where: (transaction, { eq }) => eq(transaction.id, transactionId),
		columns: {
			id: true,
			date: true,
			type: true,
			amount: true,
			description: true,
			accountId: true,
			currencyId: true,
			category: true,
		},
		with: { account: { columns: { ownerId: true } } },
	})
}

export async function getTransactions({
	db,
	ownerId,
	page,
	accountId,
	currencyId,
	category,
	transactionType,
}: {
	db: DB
	ownerId: string
	page: number
	accountId: string
	currencyId: string
	category: TCategory
	transactionType: TTransactionType | ''
}) {
	const filters = [
		eq(schema.account.ownerId, ownerId),
		ne(schema.account.accountType, ACCOUNT_TYPE_CREDIT_CARD),
	]
	if (accountId) {
		filters.push(eq(schema.transaction.accountId, accountId))
	}
	if (currencyId) {
		filters.push(eq(schema.transaction.currencyId, currencyId))
	}
	if (category) {
		filters.push(eq(schema.transaction.category, category))
	}
	if (transactionType) {
		filters.push(eq(schema.transaction.type, transactionType))
	}

	const query = db
		.select({
			id: schema.transaction.id,
			date: schema.transaction.date,
			amount: sql<string>`CAST(${schema.transaction.amount} / 100.0 as TEXT)`,
			type: schema.transaction.type,
			description: schema.transaction.description,
			accountId: schema.transaction.accountId,
			currencyId: schema.transaction.currencyId,
			currency: schema.currency.code,
			account: schema.account.name,
			accountType: schema.account.accountType,
			category: schema.transaction.category,
		})
		.from(schema.transaction)
		.innerJoin(
			schema.currency,
			eq(schema.transaction.currencyId, schema.currency.id),
		)
		.innerJoin(
			schema.account,
			eq(schema.transaction.accountId, schema.account.id),
		)
		.where(and(...filters))
		.orderBy(
			desc(schema.transaction.date),
			desc(schema.transaction.createdAt),
		)

	const total = await db.$count(query)
	const transactions = await query
		.limit(PAGE_SIZE)
		.offset((page - 1) * PAGE_SIZE)

	const pages = Math.ceil(total / PAGE_SIZE)

	return { transactions, pagination: { page, pages, total } }
}

export async function getTransactionBalance({
	db,
	ownerId,
	accountId,
	currencyId,
}: {
	db: DB
	ownerId: string
	accountId: string
	currencyId: string
}) {
	const [result] = await getBalances({
		db,
		ownerId,
		accountId,
		currencyId,
		parseBalance: false,
	})
	return result
}

// mutations --------

export async function deleteTransaction({
	db,
	transactionId,
}: {
	db: DB
	transactionId: string
}) {
	await db
		.delete(schema.transaction)
		.where(eq(schema.transaction.id, transactionId))
}

export async function createTransaction({
	db,
	data,
}: {
	db: DB
	data: {
		date: string
		type: TTransactionType
		amount: number
		description: string
		accountId: string
		currencyId: string
		category: TCategory
	}
}) {
	await db.insert(schema.transaction).values(data)
}

export async function updateTransaction({
	db,
	transactionId,
	data,
}: {
	db: DB
	transactionId: string
	data: {
		date: string
		type: TTransactionType
		amount: number
		description: string
		accountId: string
		currencyId: string
		category: TCategory
	}
}) {
	await db
		.update(schema.transaction)
		.set(data)
		.where(eq(schema.transaction.id, transactionId))
}
