import type { DB } from '~/lib/types'
import { and, eq, gte, lte, sql, desc, asc } from 'drizzle-orm'

import {
	transaction as transactionTable,
	account as accountTable,
	currency as currencyTable,
	transactionCategory as transactionCategoryTable,
} from '~/database/schema'

import type { TTransactionType } from '~/routes/transactions/lib/types'

import type { CurrencyResponse, CategoryResponse, MonthResponse } from './types'

type Args = {
	db: DB
	ownerId: string
	transactionType: TTransactionType
	group: 'currency' | 'category' | 'month'
}

export async function getMonthTransactions(
	args: Args & { group: 'currency' },
): Promise<Array<CurrencyResponse>>

export async function getMonthTransactions(
	args: Args & { group: 'category' },
): Promise<Array<CurrencyResponse & CategoryResponse>>

export async function getMonthTransactions(
	args: Args & { group: 'month' },
): Promise<Array<CurrencyResponse & MonthResponse>>

export async function getMonthTransactions({
	db,
	ownerId,
	transactionType,
	group,
}: Args) {
	const now = new Date()
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
	const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
	const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)

	const groups = {
		currency: {
			columns: () => ({
				currencyId: transactionTable.currencyId,
				currency: currencyTable.code,
				amount: sql<string>`CAST(SUM(${transactionTable.amount}) / 100.0 AS TEXT)`.as(
					'amount',
				),
			}),
			groupBy: () => [transactionTable.currencyId],
			where: () =>
				and(
					eq(transactionTable.type, transactionType),
					gte(transactionTable.date, monthStart.toISOString()),
					lte(transactionTable.date, monthEnd.toISOString()),
				),
			orderBy: () => [desc(sql`amount`)],
		},
		category: {
			columns: () => ({
				...groups.currency.columns(),
				transactionCategoryId: transactionTable.transactionCategoryId,
				transactionCategory: transactionCategoryTable.name,
			}),
			groupBy: () => [
				...groups.currency.groupBy(),
				transactionTable.transactionCategoryId,
			],
			where: () => groups.currency.where(),
			orderBy: () => [...groups.currency.orderBy()],
		},
		month: {
			columns: () => ({
				...groups.currency.columns(),
				month: sql<number>`CAST(strftime('%m', ${transactionTable.date}) AS INTEGER)`.as(
					'month',
				),
				year: sql<number>`CAST(strftime('%Y', ${transactionTable.date}) AS INTEGER)`.as(
					'year',
				),
			}),
			groupBy: () => [
				...groups.currency.groupBy(),
				sql`month`,
				sql`year`,
			],
			where: () =>
				and(
					eq(transactionTable.type, transactionType),
					gte(transactionTable.date, yearAgo.toISOString()),
				),
			orderBy: () => [asc(sql`year`), asc(sql`month`)],
		},
	}

	const { columns, groupBy, where, orderBy } = groups[group]

	return db
		.select(columns())
		.from(transactionTable)
		.innerJoin(
			accountTable,
			and(
				eq(accountTable.id, transactionTable.accountId),
				eq(accountTable.ownerId, ownerId),
			),
		)
		.innerJoin(
			currencyTable,
			eq(currencyTable.id, transactionTable.currencyId),
		)
		.innerJoin(
			transactionCategoryTable,
			eq(
				transactionCategoryTable.id,
				transactionTable.transactionCategoryId,
			),
		)
		.where(where())
		.groupBy(...groupBy())
		.orderBy(...orderBy())
}
