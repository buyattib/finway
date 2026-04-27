import { and, eq, gte, lte, sql, desc, asc, ne } from 'drizzle-orm'

import * as schema from '~/database/schema'
import type { DB } from '~/lib/types'

import type { TTransactionType } from '~/features/transactions/types'
import { ACCOUNT_TYPE_CREDIT_CARD } from '~/routes/accounts/lib/constants'

import { TRANSACTION_TYPE_EXPENSE } from '~/features/transactions/constants'

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
}: Args) {
	const { monthStart, monthEnd } = getMonthRange()
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
				gte(schema.transaction.date, monthStart.toISOString()),
				lte(schema.transaction.date, monthEnd.toISOString()),
			),
		)
		.groupBy(schema.transaction.currencyId)
		.orderBy(desc(sumExpr))
}

export async function getMonthTransactionsByCategory({
	db,
	ownerId,
	transactionType,
}: {
	db: DB
	ownerId: string
	transactionType: TTransactionType
}) {
	const { monthStart, monthEnd } = getMonthRange()
	const sumExpr = sql<number>`SUM(${schema.transaction.amount}) / 100.0`
	const amountExpr = sql<string>`CAST(${sumExpr} AS TEXT)`

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
		.orderBy(desc(sumExpr))
}

export async function getMonthlyCreditCardExpenses({
	db,
	ownerId,
}: {
	db: DB
	ownerId: string
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
		.where(eq(schema.transaction.type, TRANSACTION_TYPE_EXPENSE))
		.groupBy(yearExpr, monthExpr, schema.currency.id)
		.orderBy(asc(yearExpr), asc(monthExpr))
}
