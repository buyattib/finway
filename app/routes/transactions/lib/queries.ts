import { and, desc, eq, sql } from 'drizzle-orm'

import {
	currency as currencyTable,
	account as accountTable,
	transaction as transactionTable,
} from '~/database/schema'
import { getBalances } from '~/lib/queries'
import { PAGE_SIZE } from '~/lib/constants'
import type { DB } from '~/lib/types'

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
	const filters = [eq(accountTable.ownerId, ownerId)]
	if (accountId) {
		filters.push(eq(transactionTable.accountId, accountId))
	}
	if (currencyId) {
		filters.push(eq(transactionTable.currencyId, currencyId))
	}
	if (category) {
		filters.push(eq(transactionTable.category, category))
	}
	if (transactionType) {
		filters.push(eq(transactionTable.type, transactionType))
	}

	const query = db
		.select({
			id: transactionTable.id,
			date: transactionTable.date,
			amount: sql<string>`CAST(${transactionTable.amount} / 100.0 as TEXT)`,
			type: transactionTable.type,
			currency: currencyTable.code,
			account: accountTable.name,
			accountType: accountTable.accountType,
			category: transactionTable.category,
		})
		.from(transactionTable)
		.innerJoin(
			currencyTable,
			eq(transactionTable.currencyId, currencyTable.id),
		)
		.innerJoin(
			accountTable,
			eq(transactionTable.accountId, accountTable.id),
		)
		.where(and(...filters))
		.orderBy(desc(transactionTable.date), desc(transactionTable.createdAt))

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
		.delete(transactionTable)
		.where(eq(transactionTable.id, transactionId))
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
	await db.insert(transactionTable).values(data)
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
		.update(transactionTable)
		.set(data)
		.where(eq(transactionTable.id, transactionId))
}
