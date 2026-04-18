import { and, eq, or, desc, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'

import {
	currency as currencyTable,
	account as accountTable,
	exchange as exchangeTable,
} from '~/database/schema'
import { getBalances } from '~/lib/queries'
import type { DB } from '~/lib/types'
import { PAGE_SIZE } from '~/lib/constants'

// fetch --------

export async function getExchangeById({
	db,
	exchangeId,
}: {
	db: DB
	exchangeId: string
}) {
	return db.query.exchange.findFirst({
		where: (exchange, { eq }) => eq(exchange.id, exchangeId),
		columns: {
			id: true,
			accountId: true,
			toCurrencyId: true,
			toAmount: true,
		},
		with: { account: { columns: { ownerId: true } } },
	})
}

export async function getExchanges({
	db,
	ownerId,
	page,
	accountId,
	currencyId,
}: {
	db: DB
	ownerId: string
	page: number
	accountId?: string
	currencyId?: string
}) {
	const fromCurrencyAlias = alias(currencyTable, 'fromCurrency')
	const toCurrencyAlias = alias(currencyTable, 'toCurrency')

	const filters = [eq(accountTable.ownerId, ownerId)]
	if (accountId) {
		filters.push(eq(exchangeTable.accountId, accountId))
	}
	if (currencyId) {
		const currencyMatch = or(
			eq(exchangeTable.fromCurrencyId, currencyId),
			eq(exchangeTable.toCurrencyId, currencyId),
		)
		if (currencyMatch) filters.push(currencyMatch)
	}

	const query = db
		.select({
			id: exchangeTable.id,
			date: exchangeTable.date,

			account: accountTable.name,
			accountType: accountTable.accountType,

			fromCurrency: fromCurrencyAlias.code,
			toCurrency: toCurrencyAlias.code,

			fromAmount: sql<string>`CAST(${exchangeTable.fromAmount} / 100.0 as TEXT)`,
			toAmount: sql<string>`CAST(${exchangeTable.toAmount} / 100.0 as TEXT)`,
		})
		.from(exchangeTable)
		.innerJoin(accountTable, eq(exchangeTable.accountId, accountTable.id))
		.innerJoin(
			fromCurrencyAlias,
			eq(exchangeTable.fromCurrencyId, fromCurrencyAlias.id),
		)
		.innerJoin(
			toCurrencyAlias,
			eq(exchangeTable.toCurrencyId, toCurrencyAlias.id),
		)
		.where(and(...filters))
		.orderBy(desc(exchangeTable.date), desc(exchangeTable.createdAt))

	const total = await db.$count(query)
	const exchanges = await query
		.limit(PAGE_SIZE)
		.offset((page - 1) * PAGE_SIZE)

	return { exchanges, total }
}

export async function getExchangeBalance({
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

export async function deleteExchange({
	db,
	exchangeId,
}: {
	db: DB
	exchangeId: string
}) {
	await db.delete(exchangeTable).where(eq(exchangeTable.id, exchangeId))
}

export async function createExchange({
	db,
	values,
}: {
	db: DB
	values: {
		date: string
		fromAmount: number
		toAmount: number
		fromCurrencyId: string
		toCurrencyId: string
		accountId: string
	}
}) {
	await db.insert(exchangeTable).values(values)
}
