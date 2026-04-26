import { and, eq, desc, ne, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'

import * as schema from '~/database/schema'
import { getBalances } from '~/lib/queries'
import type { DB } from '~/lib/types'
import { PAGE_SIZE } from '~/lib/constants'

import { ACCOUNT_TYPE_CREDIT_CARD } from '~/routes/accounts/lib/constants'

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
			date: true,
			accountId: true,
			fromCurrencyId: true,
			toCurrencyId: true,
			fromAmount: true,
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
	fromCurrencyId,
	toCurrencyId,
}: {
	db: DB
	ownerId: string
	page: number
	accountId?: string
	fromCurrencyId?: string
	toCurrencyId?: string
}) {
	const fromCurrencyAlias = alias(schema.currency, 'fromCurrency')
	const toCurrencyAlias = alias(schema.currency, 'toCurrency')

	const filters = [
		eq(schema.account.ownerId, ownerId),
		ne(schema.account.accountType, ACCOUNT_TYPE_CREDIT_CARD),
	]
	if (accountId) {
		filters.push(eq(schema.exchange.accountId, accountId))
	}
	if (fromCurrencyId) {
		filters.push(eq(schema.exchange.fromCurrencyId, fromCurrencyId))
	}
	if (toCurrencyId) {
		filters.push(eq(schema.exchange.toCurrencyId, toCurrencyId))
	}

	const query = db
		.select({
			id: schema.exchange.id,
			date: schema.exchange.date,

			account: schema.account.name,
			accountType: schema.account.accountType,

			fromCurrency: fromCurrencyAlias.code,
			toCurrency: toCurrencyAlias.code,

			fromAmount: sql<string>`CAST(${schema.exchange.fromAmount} / 100.0 as TEXT)`,
			toAmount: sql<string>`CAST(${schema.exchange.toAmount} / 100.0 as TEXT)`,
		})
		.from(schema.exchange)
		.innerJoin(
			schema.account,
			eq(schema.exchange.accountId, schema.account.id),
		)
		.innerJoin(
			fromCurrencyAlias,
			eq(schema.exchange.fromCurrencyId, fromCurrencyAlias.id),
		)
		.innerJoin(
			toCurrencyAlias,
			eq(schema.exchange.toCurrencyId, toCurrencyAlias.id),
		)
		.where(and(...filters))
		.orderBy(desc(schema.exchange.date), desc(schema.exchange.createdAt))

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
	await db.delete(schema.exchange).where(eq(schema.exchange.id, exchangeId))
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
	await db.insert(schema.exchange).values(values)
}

export async function updateExchange({
	db,
	exchangeId,
	data,
}: {
	db: DB
	exchangeId: string
	data: {
		date: string
		fromAmount: number
		toAmount: number
		fromCurrencyId: string
		toCurrencyId: string
		accountId: string
	}
}) {
	await db
		.update(schema.exchange)
		.set(data)
		.where(eq(schema.exchange.id, exchangeId))
}
