import { cuid2 } from 'drizzle-cuid2/sqlite'
import { relations } from 'drizzle-orm'
import {
	sqliteTable,
	text,
	integer,
	foreignKey,
	index,
} from 'drizzle-orm/sqlite-core'

import {
	CURRENCIES,
	ACCOUNT_TYPES,
	TRANSACTION_TYPES,
	CC_TRANSACTION_TYPES,
} from '~/lib/constants'

const base = {
	createdAt: text()
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text()
		.notNull()
		.$defaultFn(() => new Date().toISOString())
		.$onUpdate(() => new Date().toISOString()),
}

export const user = sqliteTable('users', {
	...base,
	id: cuid2().defaultRandom().primaryKey(),
	email: text().notNull().unique('users_email_unique_idx'),
})

export const currency = sqliteTable('currencies', {
	...base,
	id: cuid2().defaultRandom().primaryKey(),
	code: text({ enum: CURRENCIES })
		.notNull()
		.unique('currencies_code_unique_idx'),
})

export const account = sqliteTable(
	'accounts',
	{
		...base,
		id: cuid2().defaultRandom().primaryKey(),
		name: text().notNull(),
		description: text().default(''),
		accountType: text({ enum: ACCOUNT_TYPES }).notNull(),

		ownerId: text().notNull(),
	},
	table => [
		foreignKey({
			name: 'accounts_users_fk',
			columns: [table.ownerId],
			foreignColumns: [user.id],
		}).onDelete('cascade'),
		index('accounts_ownerId_idx').on(table.ownerId),
	],
)

export const transactionCategory = sqliteTable(
	'transaction_categories',
	{
		...base,
		id: cuid2().defaultRandom().primaryKey(),
		name: text().notNull(),
		description: text().default(''),

		ownerId: text().notNull(),
	},
	table => [
		foreignKey({
			name: 'transaction_categories_users_fk',
			columns: [table.ownerId],
			foreignColumns: [user.id],
		}).onDelete('cascade'),
	],
)

export const transaction = sqliteTable(
	'transactions',
	{
		...base,
		id: cuid2().defaultRandom().primaryKey(),
		date: text().notNull(),
		amount: integer().notNull(),
		description: text().default(''),
		type: text({ enum: TRANSACTION_TYPES }).notNull(),

		accountId: text().notNull(),
		currencyId: text().notNull(),
		transactionCategoryId: text().notNull(),
	},
	table => [
		foreignKey({
			name: 'transactions_accounts_fk',
			columns: [table.accountId],
			foreignColumns: [account.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'transactions_currencies_fk',
			columns: [table.currencyId],
			foreignColumns: [currency.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'transactions_transaction_categories_fk',
			columns: [table.transactionCategoryId],
			foreignColumns: [transactionCategory.id],
		}).onDelete('cascade'),
		index('transactions_accountId_currencyId_idx').on(
			table.accountId,
			table.currencyId,
		),
	],
)

export const transfer = sqliteTable(
	'transfers',
	{
		...base,
		id: cuid2().defaultRandom().primaryKey(),
		date: text().notNull(),
		amount: integer().notNull(),

		fromAccountId: text().notNull(),
		toAccountId: text().notNull(),
		currencyId: text().notNull(),
	},
	table => [
		foreignKey({
			name: 'transfers_from_accounts_fk',
			columns: [table.fromAccountId],
			foreignColumns: [account.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'transfers_to_accounts_fk',
			columns: [table.toAccountId],
			foreignColumns: [account.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'transfers_currencies_fk',
			columns: [table.currencyId],
			foreignColumns: [currency.id],
		}).onDelete('cascade'),
		index('transfers_fromAccountId_currencyId_idx').on(
			table.fromAccountId,
			table.currencyId,
		),
		index('transfers_toAccountId_currencyId_idx').on(
			table.toAccountId,
			table.currencyId,
		),
	],
)

export const exchange = sqliteTable(
	'exchanges',
	{
		...base,
		id: cuid2().defaultRandom().primaryKey(),
		date: text().notNull(),
		fromAmount: integer().notNull(),
		toAmount: integer().notNull(),

		accountId: text().notNull(),
		fromCurrencyId: text().notNull(),
		toCurrencyId: text().notNull(),
	},
	table => [
		foreignKey({
			name: 'exchanges_accounts_fk',
			columns: [table.accountId],
			foreignColumns: [account.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'exchanges_from_currencies_fk',
			columns: [table.fromCurrencyId],
			foreignColumns: [currency.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'exchanges_to_currencies_fk',
			columns: [table.toCurrencyId],
			foreignColumns: [currency.id],
		}).onDelete('cascade'),
		index('exchanges_accountId_fromCurrencyId_idx').on(
			table.accountId,
			table.fromCurrencyId,
		),
		index('exchanges_accountId_toCurrencyId_idx').on(
			table.accountId,
			table.toCurrencyId,
		),
	],
)

export const creditCard = sqliteTable(
	'credit_cards',
	{
		...base,
		id: cuid2().defaultRandom().primaryKey(),

		brand: text().notNull(),
		last4: text().notNull(),
		expiryMonth: text().notNull(),
		expiryYear: text().notNull(),

		accountId: text().notNull(),
		currencyId: text().notNull(),
	},
	table => [
		foreignKey({
			name: 'credit_cards_accounts_fk',
			columns: [table.accountId],
			foreignColumns: [account.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'credit_cards_currencies_fk',
			columns: [table.currencyId],
			foreignColumns: [currency.id],
		}).onDelete('cascade'),
		index('credit_cards_accountId_currencyId_idx').on(
			table.accountId,
			table.currencyId,
		),
	],
)

export const creditCardTransaction = sqliteTable(
	'credit_card_transactions',
	{
		...base,
		id: cuid2().defaultRandom().primaryKey(),
		date: text().notNull(),
		amount: integer().notNull(),
		description: text().default(''),
		type: text({ enum: CC_TRANSACTION_TYPES }).notNull(),

		creditCardId: text().notNull(),
		transactionCategoryId: text().notNull(),
	},
	table => [
		foreignKey({
			name: 'credit_card_transactions_credit_cards_fk',
			columns: [table.creditCardId],
			foreignColumns: [creditCard.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'credit_card_transactions_transaction_categories_fk',
			columns: [table.transactionCategoryId],
			foreignColumns: [transactionCategory.id],
		}).onDelete('cascade'),
		index('credit_card_transactions_creditCardId_idx').on(
			table.creditCardId,
		),
	],
)

export const creditCardTransactionInstallment = sqliteTable(
	'credit_card_transaction_installments',
	{
		...base,
		id: cuid2().defaultRandom().primaryKey(),
		installmentNumber: integer().notNull(),
		amount: integer().notNull(),
		date: text().notNull(),

		creditCardTransactionId: text().notNull(),
	},
	table => [
		foreignKey({
			name: 'credit_card_transaction_installments_credit_card_transactions_fk',
			columns: [table.creditCardTransactionId],
			foreignColumns: [creditCardTransaction.id],
		}).onDelete('cascade'),
		index(
			'credit_card_transaction_installments_creditCardTransactionId_idx',
		).on(table.creditCardTransactionId),
	],
)

// ORM Relations

export const transactionRelations = relations(transaction, ({ one }) => ({
	account: one(account, {
		fields: [transaction.accountId],
		references: [account.id],
	}),
	currency: one(currency, {
		fields: [transaction.currencyId],
		references: [currency.id],
	}),
	transactionCategory: one(transactionCategory, {
		fields: [transaction.transactionCategoryId],
		references: [transactionCategory.id],
	}),
}))

export const transferRelations = relations(transfer, ({ one }) => ({
	fromAccount: one(account, {
		fields: [transfer.fromAccountId],
		references: [account.id],
	}),
	toAccount: one(account, {
		fields: [transfer.toAccountId],
		references: [account.id],
	}),
	currency: one(currency, {
		fields: [transfer.currencyId],
		references: [currency.id],
	}),
}))

export const exchangeRelations = relations(exchange, ({ one }) => ({
	account: one(account, {
		fields: [exchange.accountId],
		references: [account.id],
	}),
	fromCurrency: one(currency, {
		fields: [exchange.fromCurrencyId],
		references: [currency.id],
	}),
	toCurrency: one(currency, {
		fields: [exchange.toCurrencyId],
		references: [currency.id],
	}),
}))

export const creditCardRelations = relations(creditCard, ({ one, many }) => ({
	account: one(account, {
		fields: [creditCard.accountId],
		references: [account.id],
	}),
	currency: one(currency, {
		fields: [creditCard.currencyId],
		references: [currency.id],
	}),
}))

export const creditCardTransactionRelations = relations(
	creditCardTransaction,
	({ one }) => ({
		creditCard: one(creditCard, {
			fields: [creditCardTransaction.creditCardId],
			references: [creditCard.id],
		}),
		transactionCategory: one(transactionCategory, {
			fields: [creditCardTransaction.transactionCategoryId],
			references: [transactionCategory.id],
		}),
	}),
)

export const creditCardTransactionInstallmentRelations = relations(
	creditCardTransactionInstallment,
	({ one }) => ({
		creditCardTransaction: one(creditCardTransaction, {
			fields: [creditCardTransactionInstallment.creditCardTransactionId],
			references: [creditCardTransaction.id],
		}),
	}),
)
