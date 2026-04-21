import { and, eq, sql, desc } from 'drizzle-orm'
import { unionAll } from 'drizzle-orm/sqlite-core'

import * as schema from '~/database/schema'
import type { Beautify } from '~/types/utils'

import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
} from '~/routes/transactions/lib/constants'
import type { DB, TCurrency } from './types'

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
): Promise<Array<Beautify<BaseBalance & { balance: string }>>>

export async function getBalances(
	args: Args & { parseBalance?: true; group?: 'currency' },
): Promise<Array<Beautify<CurrencyBalance & { balance: string }>>>

export async function getBalances(
	args: Args & { parseBalance?: false; group?: 'account' },
): Promise<Array<Beautify<BaseBalance & { balance: number }>>>

export async function getBalances(
	args: Args & { parseBalance?: false; group?: 'currency' },
): Promise<Array<Beautify<CurrencyBalance & { balance: number }>>>

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
			accountId: sql`${schema.account.id}`.as('accountId'),
			currencyId: sql`${schema.currency.id}`.as('currencyId'),
			currency: schema.currency.code,
			balance: sql<number>`SUM(
				CASE
					WHEN ${schema.transaction.type} = ${TRANSACTION_TYPE_INCOME} THEN ${schema.transaction.amount}
					WHEN ${schema.transaction.type} = ${TRANSACTION_TYPE_EXPENSE} THEN -${schema.transaction.amount}
					ELSE 0
				END
			)`.as('balance'),
		})
		.from(schema.account)
		.crossJoin(schema.currency)
		.leftJoin(
			schema.transaction,
			and(
				eq(schema.account.id, schema.transaction.accountId),
				eq(schema.currency.id, schema.transaction.currencyId),
			),
		)
		.where(eq(schema.account.ownerId, ownerId))
		.groupBy(schema.account.id, schema.currency.id)

	const outgoingTransferBalances = db
		.select({
			accountId: sql`${schema.account.id}`.as('accountId'),
			currencyId: sql`${schema.currency.id}`.as('currencyId'),
			currency: schema.currency.code,
			balance: sql<number>`COALESCE(-SUM(${schema.transfer.amount}), 0)`.as(
				'balance',
			),
		})
		.from(schema.account)
		.crossJoin(schema.currency)
		.leftJoin(
			schema.transfer,
			and(
				eq(schema.account.id, schema.transfer.fromAccountId),
				eq(schema.currency.id, schema.transfer.currencyId),
			),
		)
		.where(eq(schema.account.ownerId, ownerId))
		.groupBy(schema.account.id, schema.currency.id)

	const incomingTransferBalances = db
		.select({
			accountId: sql`${schema.account.id}`.as('accountId'),
			currencyId: sql`${schema.currency.id}`.as('currencyId'),
			currency: schema.currency.code,
			balance: sql<number>`COALESCE(SUM(${schema.transfer.amount}), 0)`.as(
				'balance',
			),
		})
		.from(schema.account)
		.crossJoin(schema.currency)
		.leftJoin(
			schema.transfer,
			and(
				eq(schema.account.id, schema.transfer.toAccountId),
				eq(schema.currency.id, schema.transfer.currencyId),
			),
		)
		.where(eq(schema.account.ownerId, ownerId))
		.groupBy(schema.account.id, schema.currency.id)

	const outgoingExchangeBalances = db
		.select({
			accountId: sql`${schema.account.id}`.as('accountId'),
			currencyId: sql`${schema.currency.id}`.as('currencyId'),
			currency: schema.currency.code,
			balance:
				sql<number>`COALESCE(-SUM(${schema.exchange.fromAmount}), 0)`.as(
					'balance',
				),
		})
		.from(schema.account)
		.crossJoin(schema.currency)
		.leftJoin(
			schema.exchange,
			and(
				eq(schema.account.id, schema.exchange.accountId),
				eq(schema.currency.id, schema.exchange.fromCurrencyId),
			),
		)
		.where(eq(schema.account.ownerId, ownerId))
		.groupBy(schema.account.id, schema.currency.id)

	const incomingExchangeBalances = db
		.select({
			accountId: sql`${schema.account.id}`.as('accountId'),
			currencyId: sql`${schema.currency.id}`.as('currencyId'),
			currency: schema.currency.code,
			balance:
				sql<number>`COALESCE(SUM(${schema.exchange.toAmount}), 0)`.as(
					'balance',
				),
		})
		.from(schema.account)
		.crossJoin(schema.currency)
		.leftJoin(
			schema.exchange,
			and(
				eq(schema.account.id, schema.exchange.accountId),
				eq(schema.currency.id, schema.exchange.toCurrencyId),
			),
		)
		.where(eq(schema.account.ownerId, ownerId))
		.groupBy(schema.account.id, schema.currency.id)

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

export async function getSelectData(db: DB, ownerId: string) {
	const accounts = await db.query.account.findMany({
		where: (account, { eq }) => eq(account.ownerId, ownerId),
		orderBy: (account, { desc }) => [desc(account.createdAt)],
		columns: { id: true, name: true, accountType: true },
	})

	const currencies = await db.query.currency.findMany({
		columns: { id: true, code: true },
	})

	return {
		accounts,
		currencies,
	}
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
		columns: { id: true, code: true },
	})
}

export async function getCurrencies({ db }: { db: DB }) {
	return db.query.currency.findMany({ columns: { id: true, code: true } })
}

export async function getUserByEmail({ db, email }: { db: DB; email: string }) {
	return db.query.user.findFirst({
		where: (user, { eq }) => eq(user.email, email),
		columns: { id: true, email: true },
	})
}

export async function createUser({ db, email }: { db: DB; email: string }) {
	const [user] = await db
		.insert(schema.user)
		.values({ email })
		.returning({ id: schema.user.id, email: schema.user.email })

	return user
}
