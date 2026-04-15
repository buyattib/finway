import { cuid2 } from 'drizzle-cuid2/sqlite'
import { relations } from 'drizzle-orm'
import {
	sqliteTable,
	text,
	integer,
	foreignKey,
	index,
} from 'drizzle-orm/sqlite-core'

import { CURRENCIES } from '~/lib/constants'
import { ACCOUNT_TYPES } from '~/routes/accounts/lib/constants'
import {
	TRANSACTION_CATEGORIES,
	TRANSACTION_TYPES,
} from '~/routes/transactions/lib/constants'
import { CC_TRANSACTION_TYPES } from '~/routes/credit-cards/lib/constants'

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

export const transaction = sqliteTable(
	'transactions',
	{
		...base,
		id: cuid2().defaultRandom().primaryKey(),
		date: text().notNull(),
		amount: integer().notNull(),
		description: text().default(''),
		category: text({ enum: TRANSACTION_CATEGORIES }).notNull(),
		type: text({ enum: TRANSACTION_TYPES }).notNull(),

		currencyId: text().notNull(),
		accountId: text().notNull(),
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
		institution: text().notNull().default(''),

		accountId: text().notNull(),
	},
	table => [
		foreignKey({
			name: 'credit_cards_accounts_fk',
			columns: [table.accountId],
			foreignColumns: [account.id],
		}).onDelete('cascade'),
		index('credit_cards_accountId_idx').on(table.accountId),
	],
)

export const creditCardStatement = sqliteTable(
	'credit_card_statements',
	{
		...base,
		id: cuid2().defaultRandom().primaryKey(),
		closingDate: text().notNull(),
		dueDate: text().notNull(),

		creditCardId: text().notNull(),
	},
	table => [
		foreignKey({
			name: 'credit_card_statements_credit_cards_fk',
			columns: [table.creditCardId],
			foreignColumns: [creditCard.id],
		}).onDelete('cascade'),
		index('credit_card_statements_creditCardId_idx').on(table.creditCardId),
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
		category: text({ enum: TRANSACTION_CATEGORIES }).notNull(),
		type: text({ enum: CC_TRANSACTION_TYPES }).notNull(),

		currencyId: text().notNull(),
		creditCardId: text().notNull(),
	},
	table => [
		foreignKey({
			name: 'credit_card_transactions_credit_cards_fk',
			columns: [table.creditCardId],
			foreignColumns: [creditCard.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'credit_card_transactions_currencies_fk',
			columns: [table.currencyId],
			foreignColumns: [currency.id],
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

		statementId: text().notNull(),
		creditCardTransactionId: text().notNull(),
	},
	table => [
		foreignKey({
			name: 'credit_card_transaction_installments_credit_card_transactions_fk',
			columns: [table.creditCardTransactionId],
			foreignColumns: [creditCardTransaction.id],
		}).onDelete('cascade'),
		foreignKey({
			name: 'credit_card_transaction_installments_credit_card_statements_fk',
			columns: [table.statementId],
			foreignColumns: [creditCardStatement.id],
		}).onDelete('cascade'),
		index(
			'credit_card_transaction_installments_creditCardTransactionId_idx',
		).on(table.creditCardTransactionId),
		index('credit_card_transaction_installments_statementId_idx').on(
			table.statementId,
		),
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
	statements: many(creditCardStatement),
}))

export const creditCardStatementRelations = relations(
	creditCardStatement,
	({ one, many }) => ({
		creditCard: one(creditCard, {
			fields: [creditCardStatement.creditCardId],
			references: [creditCard.id],
		}),
		installments: many(creditCardTransactionInstallment),
	}),
)

export const creditCardTransactionRelations = relations(
	creditCardTransaction,
	({ one }) => ({
		creditCard: one(creditCard, {
			fields: [creditCardTransaction.creditCardId],
			references: [creditCard.id],
		}),
		currency: one(currency, {
			fields: [creditCardTransaction.currencyId],
			references: [currency.id],
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
		statement: one(creditCardStatement, {
			fields: [creditCardTransactionInstallment.statementId],
			references: [creditCardStatement.id],
		}),
	}),
)
