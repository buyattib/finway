import { and, eq, gte, lte, sql, desc, ne } from 'drizzle-orm'

import * as schema from '~/database/schema'
import type { DB } from '~/lib/types'

import type { TTransactionType } from '~/features/transactions/types'
import { ACCOUNT_TYPE_CREDIT_CARD } from '~/routes/accounts/lib/constants'

import type { CategoryResponse, CurrencyResponse } from './types'

type Args = {
	db: DB
	ownerId: string
	transactionType: TTransactionType
	group: 'currency'
}

function getMonthRange() {
	const now = new Date()
	const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
	const monthEnd = new Date(
		Date.UTC(now.getFullYear(), now.getMonth() + 1, 0),
	)
	return { monthStart, monthEnd }
}

export async function getMonthTransactions({
	db,
	ownerId,
	transactionType,
}: Args): Promise<Array<CurrencyResponse>> {
	const { monthStart, monthEnd } = getMonthRange()

	return db
		.select({
			currencyId: schema.transaction.currencyId,
			currency: schema.currency.code,
			amount: sql<string>`CAST(SUM(${schema.transaction.amount}) / 100.0 AS TEXT)`.as(
				'amount',
			),
		})
		.from(schema.transaction)
		.innerJoin(
			schema.account,
			and(
				eq(schema.account.id, schema.transaction.accountId),
				eq(schema.account.ownerId, ownerId),
			),
		)
		.innerJoin(
			schema.currency,
			eq(schema.currency.id, schema.transaction.currencyId),
		)
		.where(
			and(
				eq(schema.transaction.type, transactionType),
				gte(schema.transaction.date, monthStart.toISOString()),
				lte(schema.transaction.date, monthEnd.toISOString()),
			),
		)
		.groupBy(schema.transaction.currencyId)
		.orderBy(desc(sql`SUM(${schema.transaction.amount})`))
}

export async function getMonthTransactionsByCategory({
	db,
	ownerId,
	transactionType,
}: {
	db: DB
	ownerId: string
	transactionType: TTransactionType
}): Promise<Array<CategoryResponse>> {
	const { monthStart, monthEnd } = getMonthRange()

	return db
		.select({
			category: schema.transaction.category,
			currencyId: schema.transaction.currencyId,
			currency: schema.currency.code,
			amount: sql<string>`CAST(SUM(${schema.transaction.amount}) / 100.0 AS TEXT)`.as(
				'amount',
			),
		})
		.from(schema.transaction)
		.innerJoin(
			schema.account,
			and(
				eq(schema.account.id, schema.transaction.accountId),
				eq(schema.account.ownerId, ownerId),
				ne(schema.account.accountType, ACCOUNT_TYPE_CREDIT_CARD),
			),
		)
		.innerJoin(
			schema.currency,
			eq(schema.currency.id, schema.transaction.currencyId),
		)
		.where(
			and(
				eq(schema.transaction.type, transactionType),
				gte(schema.transaction.date, monthStart.toISOString()),
				lte(schema.transaction.date, monthEnd.toISOString()),
			),
		)
		.groupBy(schema.transaction.category, schema.transaction.currencyId)
		.orderBy(desc(sql`SUM(${schema.transaction.amount})`))
}
