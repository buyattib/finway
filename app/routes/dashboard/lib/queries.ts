import type { DB } from '~/lib/types'
import { and, eq, gte, lte, sql, desc, asc, count } from 'drizzle-orm'

import {
	transaction as transactionTable,
	account as accountTable,
	currency as currencyTable,
	transactionCategory as transactionCategoryTable,
	creditCard as creditCardTable,
	creditCardTransaction as creditCardTransactionTable,
	creditCardTransactionInstallment as creditCardTransactionInstallmentTable,
} from '~/database/schema'

import type { TTransactionType } from '~/lib/types'

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

export async function getMonthCreditCardTotals({
	db,
	ownerId,
}: {
	db: DB
	ownerId: string
}) {
	const now = new Date()
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
	const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

	return db
		.select({
			currencyId: creditCardTable.currencyId,
			currency: currencyTable.code,
			amount: sql<string>`CAST(SUM(${creditCardTransactionInstallmentTable.amount}) / 100.0 AS TEXT)`.as(
				'amount',
			),
		})
		.from(creditCardTransactionInstallmentTable)
		.innerJoin(
			creditCardTransactionTable,
			eq(
				creditCardTransactionTable.id,
				creditCardTransactionInstallmentTable.creditCardTransactionId,
			),
		)
		.innerJoin(
			creditCardTable,
			eq(creditCardTable.id, creditCardTransactionTable.creditCardId),
		)
		.innerJoin(
			accountTable,
			and(
				eq(accountTable.id, creditCardTable.accountId),
				eq(accountTable.ownerId, ownerId),
			),
		)
		.innerJoin(
			currencyTable,
			eq(currencyTable.id, creditCardTable.currencyId),
		)
		.where(
			and(
				gte(
					creditCardTransactionInstallmentTable.date,
					monthStart.toISOString(),
				),
				lte(
					creditCardTransactionInstallmentTable.date,
					monthEnd.toISOString(),
				),
			),
		)
		.groupBy(creditCardTable.currencyId)
		.orderBy(desc(sql`amount`))
}

export async function getMonthInstallmentsList({
	db,
	ownerId,
}: {
	db: DB
	ownerId: string
}) {
	const now = new Date()
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
	const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

	const installmentCountSq = db
		.select({
			creditCardTransactionId:
				creditCardTransactionInstallmentTable.creditCardTransactionId,
			totalInstallments: count().as('totalInstallments'),
		})
		.from(creditCardTransactionInstallmentTable)
		.groupBy(creditCardTransactionInstallmentTable.creditCardTransactionId)
		.as('installmentCount')

	return db
		.select({
			installmentId: creditCardTransactionInstallmentTable.id,
			installmentNumber:
				creditCardTransactionInstallmentTable.installmentNumber,
			installmentAmount:
				sql<string>`CAST(${creditCardTransactionInstallmentTable.amount} / 100.0 AS TEXT)`.as(
					'installmentAmount',
				),
			installmentDate: creditCardTransactionInstallmentTable.date,

			ccTransactionId: creditCardTransactionTable.id,
			ccTransactionDate: creditCardTransactionTable.date,
			ccTransactionType: creditCardTransactionTable.type,
			ccTransactionDescription: creditCardTransactionTable.description,
			ccTransactionCategory: transactionCategoryTable.name,

			totalInstallments: installmentCountSq.totalInstallments,

			creditCardId: creditCardTable.id,
			creditCardBrand: creditCardTable.brand,
			creditCardLast4: creditCardTable.last4,

			currency: currencyTable.code,
		})
		.from(creditCardTransactionInstallmentTable)
		.innerJoin(
			creditCardTransactionTable,
			eq(
				creditCardTransactionTable.id,
				creditCardTransactionInstallmentTable.creditCardTransactionId,
			),
		)
		.innerJoin(
			installmentCountSq,
			eq(
				installmentCountSq.creditCardTransactionId,
				creditCardTransactionInstallmentTable.creditCardTransactionId,
			),
		)
		.innerJoin(
			transactionCategoryTable,
			eq(
				transactionCategoryTable.id,
				creditCardTransactionTable.transactionCategoryId,
			),
		)
		.innerJoin(
			creditCardTable,
			eq(creditCardTable.id, creditCardTransactionTable.creditCardId),
		)
		.innerJoin(
			accountTable,
			and(
				eq(accountTable.id, creditCardTable.accountId),
				eq(accountTable.ownerId, ownerId),
			),
		)
		.innerJoin(
			currencyTable,
			eq(currencyTable.id, creditCardTable.currencyId),
		)
		.where(
			and(
				gte(
					creditCardTransactionInstallmentTable.date,
					monthStart.toISOString(),
				),
				lte(
					creditCardTransactionInstallmentTable.date,
					monthEnd.toISOString(),
				),
			),
		)
		.orderBy(
			asc(creditCardTransactionInstallmentTable.date),
			asc(creditCardTransactionTable.id),
		)
}
