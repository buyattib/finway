import { and, eq, sql, desc } from 'drizzle-orm'
import { unionAll } from 'drizzle-orm/sqlite-core'

import {
	currency as currencyTable,
	account as accountTable,
	transfer as transferTable,
	exchange as exchangeTable,
	transaction as transactionTable,
} from '~/database/schema'
import type { DB } from '~/lib/types'

import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
} from '~/routes/transactions/lib/constants'

import type { TCurrency } from './types'

type BaseBalance = {
	accountId: string
	currencyId: string
	currency: TCurrency
}

type Args = {
	db: DB
	ownerId: string
	accountId?: string
	currencyId?: string
	parseBalance?: boolean
}

export async function getBalances(
	args: Args & { parseBalance?: true },
): Promise<Array<BaseBalance & { balance: string }>>

export async function getBalances(
	args: Args & { parseBalance?: false },
): Promise<Array<BaseBalance & { balance: number }>>

export async function getBalances({
	db,
	ownerId,
	accountId,
	currencyId,
	parseBalance = true,
}: Args) {
	const transactionBalances = db
		.select({
			accountId: transactionTable.accountId,
			currencyId: transactionTable.currencyId,
			currency: currencyTable.code,
			balance: sql<number>`SUM(
					CASE 
					WHEN ${transactionTable.type} = ${TRANSACTION_TYPE_INCOME} THEN ${transactionTable.amount}
					WHEN ${transactionTable.type} = ${TRANSACTION_TYPE_EXPENSE} THEN -${transactionTable.amount}
					ELSE 0
					END
				)`.as('balance'),
		})
		.from(transactionTable)
		.innerJoin(
			currencyTable,
			eq(currencyTable.id, transactionTable.currencyId),
		)
		.innerJoin(
			accountTable,
			eq(accountTable.id, transactionTable.accountId),
		)
		.where(eq(accountTable.ownerId, ownerId))
		.groupBy(transactionTable.accountId, transactionTable.currencyId)

	const outgoingTransferBalances = db
		.select({
			accountId: transferTable.fromAccountId,
			currencyId: transferTable.currencyId,
			currency: currencyTable.code,
			balance: sql<number>`-SUM(${transferTable.amount})`,
		})
		.from(transferTable)
		.innerJoin(
			currencyTable,
			eq(currencyTable.id, transferTable.currencyId),
		)
		.innerJoin(
			accountTable,
			eq(accountTable.id, transferTable.fromAccountId),
		)
		.where(eq(accountTable.ownerId, ownerId))
		.groupBy(transferTable.fromAccountId, transferTable.currencyId)

	const incomingTransferBalances = db
		.select({
			accountId: transferTable.toAccountId,
			currencyId: transferTable.currencyId,
			currency: currencyTable.code,
			balance: sql<number>`SUM(${transferTable.amount})`,
		})
		.from(transferTable)
		.innerJoin(
			currencyTable,
			eq(currencyTable.id, transferTable.currencyId),
		)
		.innerJoin(accountTable, eq(accountTable.id, transferTable.toAccountId))
		.where(eq(accountTable.ownerId, ownerId))
		.groupBy(transferTable.toAccountId, transferTable.currencyId)

	const outgoingExchangeBalances = db
		.select({
			accountId: exchangeTable.accountId,
			currencyId: exchangeTable.fromCurrencyId,
			currency: currencyTable.code,
			balance: sql<number>`-SUM(${exchangeTable.fromAmount})`,
		})
		.from(exchangeTable)
		.innerJoin(
			currencyTable,
			eq(currencyTable.id, exchangeTable.fromCurrencyId),
		)
		.innerJoin(accountTable, eq(accountTable.id, exchangeTable.accountId))
		.where(eq(accountTable.ownerId, ownerId))
		.groupBy(exchangeTable.accountId, exchangeTable.fromCurrencyId)

	const incomingExchangeBalances = db
		.select({
			accountId: exchangeTable.accountId,
			currencyId: exchangeTable.toCurrencyId,
			currency: currencyTable.code,
			balance: sql<number>`SUM(${exchangeTable.toAmount})`,
		})
		.from(exchangeTable)
		.innerJoin(
			currencyTable,
			eq(currencyTable.id, exchangeTable.toCurrencyId),
		)
		.innerJoin(accountTable, eq(accountTable.id, exchangeTable.accountId))
		.where(eq(accountTable.ownerId, ownerId))
		.groupBy(exchangeTable.accountId, exchangeTable.toCurrencyId)

	const allBalances = unionAll(
		transactionBalances,
		outgoingTransferBalances,
		incomingTransferBalances,
		outgoingExchangeBalances,
		incomingExchangeBalances,
	).as('allBalances')

	const filters = []
	if (accountId) {
		filters.push(eq(allBalances.accountId, accountId))
	}

	if (currencyId) {
		filters.push(eq(allBalances.currencyId, currencyId))
	}

	const balances = await db
		.select({
			accountId: allBalances.accountId,
			currencyId: allBalances.currencyId,
			currency: allBalances.currency,
			balance: parseBalance
				? sql<string>`CAST(SUM(${allBalances.balance}) / 100.0 AS TEXT)`
				: sql<number>`SUM(${allBalances.balance})`,
		})
		.from(allBalances)
		.where(and(...filters))
		.groupBy(allBalances.accountId, allBalances.currencyId)
		.orderBy(desc(sql`SUM(${allBalances.balance})`))

	return balances
}
