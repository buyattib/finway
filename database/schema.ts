import { cuid2 } from 'drizzle-cuid2/sqlite'
import { desc, relations, sql } from 'drizzle-orm'
import {
	sqliteTable,
	text,
	blob,
	integer,
	uniqueIndex,
	foreignKey,
} from 'drizzle-orm/sqlite-core'

import { CURRENCIES, ACCOUNT_TYPES } from '~/routes/accounts/lib/constants'
import { TRANSACTION_TYPES } from '~/routes/transactions/lib/constants'

const base = {
	createdAt: text()
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	updatedAt: text()
		.notNull()
		.$defaultFn(() => new Date().toISOString())
		.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	deletedAt: text().$type<string | null>().default(null),
}

export const user = sqliteTable(
	'users',
	{
		createdAt: base.createdAt,
		updatedAt: base.updatedAt,

		id: cuid2().defaultRandom().primaryKey(),
		email: text().notNull(),
	},
	table => ({
		usersEmailIdx: uniqueIndex('users_email_idx').on(table.email),
	}),
)

export const account = sqliteTable(
	'accounts',
	{
		createdAt: base.createdAt,
		updatedAt: base.updatedAt,

		id: cuid2().defaultRandom().primaryKey(),
		name: text().notNull(),
		description: text().default(''),
		accountType: text({ enum: ACCOUNT_TYPES }).notNull(),

		ownerId: text().notNull(),
	},
	table => ({
		accountOwnerIdFk: foreignKey({
			name: 'accounts_ownerId_fk',
			columns: [table.ownerId],
			foreignColumns: [user.id],
		}).onDelete('cascade'),
	}),
)

export const wallet = sqliteTable(
	'wallets',
	{
		createdAt: base.createdAt,
		updatedAt: base.updatedAt,

		id: cuid2().defaultRandom().primaryKey(),
		currency: text({ enum: CURRENCIES }).notNull(),
		balance: integer().notNull(), // store in base units (i.e. cents)

		accountId: text().notNull(),
	},
	table => ({
		walletAccountIdFk: foreignKey({
			name: 'wallets_accountId_fk',
			columns: [table.accountId],
			foreignColumns: [account.id],
		}).onDelete('cascade'),
	}),
)

export const transactionCategory = sqliteTable(
	'transaction_categories',
	{
		createdAt: base.createdAt,
		updatedAt: base.updatedAt,

		id: cuid2().defaultRandom().primaryKey(),
		name: text().notNull(),
		description: text().default(''),

		ownerId: text().notNull(),
	},
	table => ({
		transactionCategoryOwnerIdFk: foreignKey({
			name: 'transaction_categories_ownerId_fk',
			columns: [table.ownerId],
			foreignColumns: [user.id],
		}).onDelete('cascade'),
	}),
)

export const transaction = sqliteTable(
	'transactions',
	{
		createdAt: base.createdAt,
		updatedAt: base.updatedAt,

		id: cuid2().defaultRandom().primaryKey(),

		date: text().notNull(),
		amount: integer().notNull(),
		description: text().default(''),
		type: text({ enum: TRANSACTION_TYPES }).notNull(),

		ownerId: text().notNull(),
		walletId: text().notNull(),
		transactionCategoryId: text().notNull(),
	},
	table => ({
		transactionOwnerIdFk: foreignKey({
			name: 'transaction_ownerId_fk',
			columns: [table.ownerId],
			foreignColumns: [user.id],
		}).onDelete('cascade'),
		transactionTransactionCategoryIdFk: foreignKey({
			name: 'transaction_transactionCategoryId_fk',
			columns: [table.transactionCategoryId],
			foreignColumns: [transactionCategory.id],
		}).onDelete('set null'),
		transactionWalletIdFk: foreignKey({
			name: 'transaction_subAccountId_fk',
			columns: [table.walletId],
			foreignColumns: [wallet.id],
		}).onDelete('cascade'),
	}),
)

// ORM Relations

export const userRelations = relations(user, ({ many }) => ({
	accounts: many(account),
	transactionCategories: many(transactionCategory),
}))

export const accountRelations = relations(account, ({ one, many }) => ({
	owner: one(user, {
		fields: [account.ownerId],
		references: [user.id],
	}),
	wallets: many(wallet),
}))

export const walletRelations = relations(wallet, ({ one }) => ({
	account: one(account, {
		fields: [wallet.accountId],
		references: [account.id],
	}),
}))

export const transactionRelations = relations(transaction, ({ one }) => ({
	owner: one(user, {
		fields: [transaction.ownerId],
		references: [user.id],
	}),
	wallet: one(wallet, {
		fields: [transaction.walletId],
		references: [wallet.id],
	}),
	transactionCategory: one(transactionCategory, {
		fields: [transaction.transactionCategoryId],
		references: [transactionCategory.id],
	}),
}))
