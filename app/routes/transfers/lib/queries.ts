import { eq, and, desc, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'

import {
	currency as currencyTable,
	account as accountTable,
	transfer as transferTable,
} from '~/database/schema'
import { getBalances } from '~/lib/queries'
import type { DB } from '~/lib/types'
import { PAGE_SIZE } from '~/lib/constants'

export async function getTransfers({
	db,
	ownerId,
	page,
}: {
	db: DB
	ownerId: string
	page: number
}) {
	const fromAccountAlias = alias(accountTable, 'fromAccount')
	const toAccountAlias = alias(accountTable, 'toAccount')

	const query = db
		.select({
			id: transferTable.id,

			date: transferTable.date,
			amount: sql<string>`CAST(${transferTable.amount} / 100.0 as TEXT)`,
			currency: currencyTable.code,

			fromAccount: fromAccountAlias.name,
			fromAccountType: fromAccountAlias.accountType,

			toAccount: toAccountAlias.name,
			toAccountType: toAccountAlias.accountType,
		})
		.from(transferTable)
		.innerJoin(
			currencyTable,
			eq(transferTable.currencyId, currencyTable.id),
		)
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
				eq(fromAccountAlias.ownerId, ownerId),
				eq(toAccountAlias.ownerId, ownerId),
			),
		)
		.orderBy(desc(transferTable.date), desc(transferTable.createdAt))

	const total = await db.$count(query)
	const transfers = await query
		.limit(PAGE_SIZE)
		.offset((page - 1) * PAGE_SIZE)

	return { transfers, total }
}

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

export async function getCurrencyById({
	db,
	currencyId,
}: {
	db: DB
	currencyId: string
}) {
	return db.query.currency.findFirst({
		where: (currency, { eq }) => eq(currency.id, currencyId),
		columns: { id: true },
	})
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
	await db.insert(transferTable).values(values)
}

export async function deleteTransfer({
	db,
	transferId,
}: {
	db: DB
	transferId: string
}) {
	await db.delete(transferTable).where(eq(transferTable.id, transferId))
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
