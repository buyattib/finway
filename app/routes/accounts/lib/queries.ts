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

type CurrencyBalance = {
	currencyId: string
	currency: TCurrency
}

type BaseBalance = CurrencyBalance & { accountId: string }

type Args = {
	db: DB
	ownerId: string
	accountId?: string
	currencyId?: string
	parseBalance?: boolean
	group?: 'account' | 'currency'
}

export async function getBalances(
	args: Args & { parseBalance?: true; group?: 'account' },
): Promise<Array<BaseBalance & { balance: string }>>

export async function getBalances(
	args: Args & { parseBalance?: true; group?: 'currency' },
): Promise<Array<CurrencyBalance & { balance: string }>>

export async function getBalances(
	args: Args & { parseBalance?: false; group?: 'account' },
): Promise<Array<BaseBalance & { balance: number }>>

export async function getBalances(
	args: Args & { parseBalance?: false; group?: 'currency' },
): Promise<Array<CurrencyBalance & { balance: number }>>

export async function getBalances({
	db,
	ownerId,
	accountId,
	currencyId,
	parseBalance = true,
	group = 'account',
}: Args) {
	const transactionBalances = db
		.select({
			accountId: sql`${accountTable.id}`.as('accountId'),
			currencyId: sql`${currencyTable.id}`.as('currencyId'),
			currency: currencyTable.code,
			balance: sql<number>`SUM(
				CASE
					WHEN ${transactionTable.type} = ${TRANSACTION_TYPE_INCOME} THEN ${transactionTable.amount}
					WHEN ${transactionTable.type} = ${TRANSACTION_TYPE_EXPENSE} THEN -${transactionTable.amount}
					ELSE 0
				END
			)`.as('balance'),
		})
		.from(accountTable)
		.crossJoin(currencyTable)
		.leftJoin(
			transactionTable,
			and(
				eq(accountTable.id, transactionTable.accountId),
				eq(currencyTable.id, transactionTable.currencyId),
			),
		)
		.where(eq(accountTable.ownerId, ownerId))
		.groupBy(accountTable.id, currencyTable.id)

	const outgoingTransferBalances = db
		.select({
			accountId: sql`${accountTable.id}`.as('accountId'),
			currencyId: sql`${currencyTable.id}`.as('currencyId'),
			currency: currencyTable.code,
			balance: sql<number>`COALESCE(-SUM(${transferTable.amount}), 0)`.as(
				'balance',
			),
		})
		.from(accountTable)
		.crossJoin(currencyTable)
		.leftJoin(
			transferTable,
			and(
				eq(accountTable.id, transferTable.fromAccountId),
				eq(currencyTable.id, transferTable.currencyId),
			),
		)
		.where(eq(accountTable.ownerId, ownerId))
		.groupBy(accountTable.id, currencyTable.id)

	const incomingTransferBalances = db
		.select({
			accountId: sql`${accountTable.id}`.as('accountId'),
			currencyId: sql`${currencyTable.id}`.as('currencyId'),
			currency: currencyTable.code,
			balance: sql<number>`COALESCE(SUM(${transferTable.amount}), 0)`.as(
				'balance',
			),
		})
		.from(accountTable)
		.crossJoin(currencyTable)
		.leftJoin(
			transferTable,
			and(
				eq(accountTable.id, transferTable.toAccountId),
				eq(currencyTable.id, transferTable.currencyId),
			),
		)
		.where(eq(accountTable.ownerId, ownerId))
		.groupBy(accountTable.id, currencyTable.id)

	const outgoingExchangeBalances = db
		.select({
			accountId: sql`${accountTable.id}`.as('accountId'),
			currencyId: sql`${currencyTable.id}`.as('currencyId'),
			currency: currencyTable.code,
			balance:
				sql<number>`COALESCE(-SUM(${exchangeTable.fromAmount}), 0)`.as(
					'balance',
				),
		})
		.from(accountTable)
		.crossJoin(currencyTable)
		.leftJoin(
			exchangeTable,
			and(
				eq(accountTable.id, exchangeTable.accountId),
				eq(currencyTable.id, exchangeTable.fromCurrencyId),
			),
		)
		.where(eq(accountTable.ownerId, ownerId))
		.groupBy(accountTable.id, currencyTable.id)

	const incomingExchangeBalances = db
		.select({
			accountId: sql`${accountTable.id}`.as('accountId'),
			currencyId: sql`${currencyTable.id}`.as('currencyId'),
			currency: currencyTable.code,
			balance:
				sql<number>`COALESCE(SUM(${exchangeTable.toAmount}), 0)`.as(
					'balance',
				),
		})
		.from(accountTable)
		.crossJoin(currencyTable)
		.leftJoin(
			exchangeTable,
			and(
				eq(accountTable.id, exchangeTable.accountId),
				eq(currencyTable.id, exchangeTable.toCurrencyId),
			),
		)
		.where(eq(accountTable.ownerId, ownerId))
		.groupBy(accountTable.id, currencyTable.id)

	const allBalances = unionAll(
		transactionBalances,
		outgoingTransferBalances,
		incomingTransferBalances,
		outgoingExchangeBalances,
		incomingExchangeBalances,
	).as('allBalances')

	const filters = []
	if (accountId) {
		filters.push(eq(sql`${allBalances.accountId}`, accountId))
	}

	if (currencyId) {
		filters.push(eq(sql`${allBalances.currencyId}`, currencyId))
	}

	const groups = {
		currency: [sql`${allBalances.currencyId}`],
		account: [
			sql`${allBalances.accountId}`,
			sql`${allBalances.currencyId}`,
		],
	}[group]

	const selections = {
		currency: () => ({
			currencyId: allBalances.currencyId,
			currency: allBalances.currency,
			balance: (parseBalance
				? sql<string>`CAST(SUM(${allBalances.balance}) / 100.0 AS TEXT)`
				: sql<number>`SUM(${allBalances.balance})`
			).as('balance'),
		}),
		account: () => ({
			accountId: allBalances.accountId,
			...selections.currency(),
		}),
	}
	const selection = selections[group]

	const balances = await db
		.select(selection())
		.from(allBalances)
		.where(and(...filters))
		.groupBy(...groups)
		.orderBy(desc(sql`SUM(${allBalances.balance})`))

	return balances
}
