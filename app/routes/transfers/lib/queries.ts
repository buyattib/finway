import { eq, and, desc, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'

import * as schema from '~/database/schema'
import { getBalances } from '~/lib/queries'
import type { DB } from '~/lib/types'
import { PAGE_SIZE } from '~/lib/constants'

// fetch --------

export async function getTransferById({
	db,
	transferId,
}: {
	db: DB
	transferId: string
}) {
	return db.query.transfer.findFirst({
		where: (transfer, { eq }) => eq(transfer.id, transferId),
		columns: {
			id: true,
			toAccountId: true,
			currencyId: true,
			amount: true,
		},
		with: {
			fromAccount: { columns: { ownerId: true } },
			toAccount: { columns: { ownerId: true } },
		},
	})
}

export async function getTransfers({
	db,
	ownerId,
	page,
	fromAccountId,
	toAccountId,
	currencyId,
}: {
	db: DB
	ownerId: string
	page: number
	fromAccountId?: string
	toAccountId?: string
	currencyId?: string
}) {
	const fromAccountAlias = alias(schema.account, 'fromAccount')
	const toAccountAlias = alias(schema.account, 'toAccount')

	const filters = [
		eq(fromAccountAlias.ownerId, ownerId),
		eq(toAccountAlias.ownerId, ownerId),
	]
	if (fromAccountId) {
		filters.push(eq(schema.transfer.fromAccountId, fromAccountId))
	}
	if (toAccountId) {
		filters.push(eq(schema.transfer.toAccountId, toAccountId))
	}
	if (currencyId) {
		filters.push(eq(schema.transfer.currencyId, currencyId))
	}

	const query = db
		.select({
			id: schema.transfer.id,

			date: schema.transfer.date,
			amount: sql<string>`CAST(${schema.transfer.amount} / 100.0 as TEXT)`,
			currency: schema.currency.code,

			fromAccount: fromAccountAlias.name,
			fromAccountType: fromAccountAlias.accountType,

			toAccount: toAccountAlias.name,
			toAccountType: toAccountAlias.accountType,
		})
		.from(schema.transfer)
		.innerJoin(
			schema.currency,
			eq(schema.transfer.currencyId, schema.currency.id),
		)
		.innerJoin(
			fromAccountAlias,
			eq(schema.transfer.fromAccountId, fromAccountAlias.id),
		)
		.innerJoin(
			toAccountAlias,
			eq(schema.transfer.toAccountId, toAccountAlias.id),
		)
		.where(and(...filters))
		.orderBy(desc(schema.transfer.date), desc(schema.transfer.createdAt))

	const total = await db.$count(query)
	const transfers = await query
		.limit(PAGE_SIZE)
		.offset((page - 1) * PAGE_SIZE)

	return { transfers, total }
}

export async function getTransferBalance({
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

export async function deleteTransfer({
	db,
	transferId,
}: {
	db: DB
	transferId: string
}) {
	await db.delete(schema.transfer).where(eq(schema.transfer.id, transferId))
}

export async function createTransfer({
	db,
	values,
}: {
	db: DB
	values: {
		date: string
		amount: number
		currencyId: string
		fromAccountId: string
		toAccountId: string
	}
}) {
	await db.insert(schema.transfer).values(values)
}
