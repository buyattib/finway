import { and, eq, gte, lte, sql, desc, asc, ne } from 'drizzle-orm'

import * as schema from '~/database/schema'
import type { DB } from '~/lib/types'

import { ACCOUNT_TYPE_CREDIT_CARD } from '~/routes/accounts/lib/constants'

import type { TTransactionType } from '~/features/transactions/types'
import { TRANSACTION_TYPE_EXPENSE } from '~/features/transactions/constants'

export async function getMonthTransactions({
	db,
	ownerId,
	transactionType,
	from,
	to,
}: {
	db: DB
	ownerId: string
	transactionType: TTransactionType
	group: 'currency'
	from: string
	to: string
}) {
	const sumExpr = sql<number>`SUM(${schema.transaction.amount}) / 100.0`
	const amountExpr = sql<string>`CAST(${sumExpr} AS TEXT)`

	return db
		.select({
			currencyId: schema.transaction.currencyId,
			currency: schema.currency.code,
			amount: amountExpr.as('amount'),
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
				gte(schema.transaction.date, from),
				lte(schema.transaction.date, to),
			),
		)
		.groupBy(schema.transaction.currencyId)
		.orderBy(desc(sumExpr))
}

export async function getMonthTransactionCurrencies({
	db,
	ownerId,
	transactionType,
	from,
	to,
}: {
	db: DB
	ownerId: string
	transactionType: TTransactionType
	from: string
	to: string
}) {
	return db
		.selectDistinct({
			currencyId: schema.transaction.currencyId,
			currency: schema.currency.code,
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
				gte(schema.transaction.date, from),
				lte(schema.transaction.date, to),
			),
		)
}

export async function getCreditCardExpenseCurrencies({
	db,
	ownerId,
}: {
	db: DB
	ownerId: string
}) {
	return db
		.selectDistinct({
			currencyId: schema.currency.id,
			currency: schema.currency.code,
		})
		.from(schema.creditCardTransactionInstallment)
		.innerJoin(
			schema.creditCardStatement,
			eq(
				schema.creditCardStatement.id,
				schema.creditCardTransactionInstallment.statementId,
			),
		)
		.innerJoin(
			schema.transaction,
			eq(
				schema.transaction.id,
				schema.creditCardTransactionInstallment.transactionId,
			),
		)
		.innerJoin(
			schema.currency,
			eq(schema.currency.id, schema.transaction.currencyId),
		)
		.innerJoin(
			schema.creditCard,
			eq(schema.creditCard.id, schema.creditCardStatement.creditCardId),
		)
		.innerJoin(
			schema.account,
			and(
				eq(schema.account.id, schema.creditCard.accountId),
				eq(schema.account.ownerId, ownerId),
			),
		)
		.where(eq(schema.transaction.type, TRANSACTION_TYPE_EXPENSE))
}

export async function getMonthTransactionsByCategory({
	db,
	ownerId,
	transactionType,
	currencyId,
	from,
	to,
}: {
	db: DB
	ownerId: string
	transactionType: TTransactionType
	currencyId: string
	from: string | null
	to: string | null
}) {
	const sumExpr = sql<number>`SUM(${schema.transaction.amount}) / 100.0`
	const amountExpr = sql<string>`CAST(${sumExpr} AS TEXT)`

	const filters = [
		eq(schema.transaction.type, transactionType),
		eq(schema.transaction.currencyId, currencyId),
	]
	if (from) filters.push(gte(schema.transaction.date, from))
	if (to) filters.push(lte(schema.transaction.date, to))

	return db
		.select({
			category: schema.transaction.category,
			currencyId: schema.transaction.currencyId,
			currency: schema.currency.code,
			amount: amountExpr.as('amount'),
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
		.where(and(...filters))
		.groupBy(schema.transaction.category, schema.transaction.currencyId)
		.orderBy(desc(sumExpr))
}

export async function getMonthlyCreditCardExpenses({
	db,
	ownerId,
	currencyId,
}: {
	db: DB
	ownerId: string
	currencyId: string
}) {
	const monthExpr = sql<string>`strftime('%m', ${schema.creditCardStatement.dueDate})`
	const yearExpr = sql<string>`strftime('%Y', ${schema.creditCardStatement.dueDate})`

	const sumExpr = sql<number>`SUM(${schema.creditCardTransactionInstallment.amount}) / 100.0`
	const amountExpr = sql<string>`CAST(${sumExpr} AS TEXT)`

	return db
		.select({
			month: monthExpr.as('month'),
			year: yearExpr.as('year'),
			amount: amountExpr.as('amount'),
			currencyId: schema.currency.id,
			currency: schema.currency.code,
		})
		.from(schema.creditCardTransactionInstallment)
		.innerJoin(
			schema.creditCardStatement,
			eq(
				schema.creditCardStatement.id,
				schema.creditCardTransactionInstallment.statementId,
			),
		)
		.innerJoin(
			schema.transaction,
			eq(
				schema.transaction.id,
				schema.creditCardTransactionInstallment.transactionId,
			),
		)
		.innerJoin(
			schema.currency,
			eq(schema.currency.id, schema.transaction.currencyId),
		)
		.innerJoin(
			schema.creditCard,
			eq(schema.creditCard.id, schema.creditCardStatement.creditCardId),
		)
		.innerJoin(
			schema.account,
			and(
				eq(schema.account.id, schema.creditCard.accountId),
				eq(schema.account.ownerId, ownerId),
			),
		)
		.where(
			and(
				eq(schema.transaction.type, TRANSACTION_TYPE_EXPENSE),
				eq(schema.currency.id, currencyId),
			),
		)
		.groupBy(yearExpr, monthExpr, schema.currency.id)
		.orderBy(asc(yearExpr), asc(monthExpr))
}
