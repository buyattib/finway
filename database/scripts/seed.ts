import { eq } from 'drizzle-orm'

import { ACCOUNT_TYPES } from '~/routes/accounts/lib/constants'
import {
	TRANSACTION_CATEGORIES,
	TRANSACTION_TYPES,
} from '~/routes/transactions/lib/constants'
import {
	CC_BRANDS,
	CC_TRANSACTION_TYPES,
} from '~/routes/credit-cards/lib/constants'

import * as schema from '../schema'
import { getDb } from './db'

const db = getDb(schema)

function pick<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

function daysAgo(n: number) {
	const d = new Date()
	d.setDate(d.getDate() - n)
	return d.toISOString()
}

async function seed() {
	console.log('Seeding database...')

	const email = 'buyattib29@gmail.com'

	const existingUser = await db
		.select()
		.from(schema.user)
		.where(eq(schema.user.email, email))
		.get()

	const insertedUser =
		existingUser ??
		(
			await db.insert(schema.user).values({ email }).returning()
		)[0]

	const currencies = await db.select().from(schema.currency)

	const accounts = await db
		.insert(schema.account)
		.values(
			ACCOUNT_TYPES.map(type => ({
				name: `${type} account`,
				description: `Seeded ${type} account`,
				accountType: type,
				ownerId: insertedUser.id,
			})),
		)
		.returning()

	const transactionValues = Array.from({ length: 30 }, (_, i) => ({
		date: daysAgo(i),
		amount: randInt(500, 50000),
		category: pick(TRANSACTION_CATEGORIES),
		type: pick(TRANSACTION_TYPES),
		description: `Seed transaction ${i + 1}`,
		accountId: pick(accounts).id,
		currencyId: pick(currencies).id,
	}))
	await db.insert(schema.transaction).values(transactionValues)

	const transferValues = Array.from({ length: 5 }, (_, i) => {
		const from = pick(accounts)
		let to = pick(accounts)
		while (to.id === from.id) to = pick(accounts)
		return {
			date: daysAgo(i * 2),
			amount: randInt(1000, 20000),
			fromAccountId: from.id,
			toAccountId: to.id,
			currencyId: pick(currencies).id,
		}
	})
	await db.insert(schema.transfer).values(transferValues)

	const exchangeValues = Array.from({ length: 5 }, (_, i) => {
		const fromCurrency = pick(currencies)
		let toCurrency = pick(currencies)
		while (toCurrency.id === fromCurrency.id) toCurrency = pick(currencies)
		const fromAmount = randInt(1000, 20000)
		return {
			date: daysAgo(i * 3),
			fromAmount,
			toAmount: Math.round(fromAmount * (0.8 + Math.random() * 0.4)),
			accountId: pick(accounts).id,
			fromCurrencyId: fromCurrency.id,
			toCurrencyId: toCurrency.id,
		}
	})
	await db.insert(schema.exchange).values(exchangeValues)

	const creditCards = await db
		.insert(schema.creditCard)
		.values(
			Array.from({ length: 2 }, () => ({
				brand: pick(CC_BRANDS),
				last4: String(randInt(1000, 9999)),
				expiryMonth: String(randInt(1, 12)).padStart(2, '0'),
				expiryYear: String(randInt(2027, 2032)),
				institution: pick(['Chase', 'Santander', 'Galicia', 'BBVA']),
				ownerId: insertedUser.id,
			})),
		)
		.returning()

	const statements: (typeof schema.creditCardStatement.$inferSelect)[] = []
	for (const card of creditCards) {
		const rows = await db
			.insert(schema.creditCardStatement)
			.values(
				Array.from({ length: 3 }, (_, i) => ({
					closingDate: daysAgo((i + 1) * 30),
					dueDate: daysAgo((i + 1) * 30 - 10),
					creditCardId: card.id,
				})),
			)
			.returning()
		statements.push(...rows)
	}

	const ccTransactions = await db
		.insert(schema.creditCardTransaction)
		.values(
			Array.from({ length: 15 }, (_, i) => ({
				date: daysAgo(i * 2),
				amount: randInt(500, 30000),
				category: pick(TRANSACTION_CATEGORIES),
				type: pick(CC_TRANSACTION_TYPES),
				description: `Seed CC transaction ${i + 1}`,
				creditCardId: pick(creditCards).id,
				currencyId: pick(currencies).id,
			})),
		)
		.returning()

	const installmentValues = ccTransactions.flatMap(tx => {
		const count = pick([1, 3, 6])
		const per = Math.round(tx.amount / count)
		return Array.from({ length: count }, (_, i) => ({
			installmentNumber: i + 1,
			amount: per,
			statementId: pick(statements).id,
			creditCardTransactionId: tx.id,
		}))
	})
	await db
		.insert(schema.creditCardTransactionInstallment)
		.values(installmentValues)

	console.log('Seed complete.')
}

seed()
	.catch(err => {
		console.error(err)
		process.exit(1)
	})
	.finally(() => process.exit(0))
