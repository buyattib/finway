import { cuid2 } from 'drizzle-cuid2/sqlite'
import { relations, sql } from 'drizzle-orm'
import {
	sqliteTable,
	text,
	blob,
	integer,
	uniqueIndex,
	foreignKey,
} from 'drizzle-orm/sqlite-core'

import { CURRENCIES, ACCOUNT_TYPES } from '~/routes/accounts/lib/constants'

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
		lastLoginEmail: text(),
	},
	table => ({
		usersEmailIdx: uniqueIndex('users_email_idx').on(table.email),
	}),
)

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
	table => ({
		accountOwnerIdFk: foreignKey({
			name: 'accounts_ownerId_fk',
			columns: [table.ownerId],
			foreignColumns: [user.id],
		}).onDelete('cascade'),
	}),
)

export const accountImages = sqliteTable(
	'account_images',
	{
		...base,
		id: cuid2().defaultRandom().primaryKey(),
		altText: text(),
		blob: blob().notNull(),

		accountId: text().notNull(),
	},
	table => ({
		accountImagesAccountIdFk: foreignKey({
			name: 'account_images_accountId_fk',
			columns: [table.accountId],
			foreignColumns: [account.id],
		}).onDelete('cascade'),
	}),
)

export const subAccount = sqliteTable(
	'sub_accounts',
	{
		...base,
		id: cuid2().defaultRandom().primaryKey(),
		currency: text({ enum: CURRENCIES }).notNull(),
		balance: integer().notNull(), // store in base units (i.e. cents)

		accountId: text().notNull(),
	},
	table => ({
		subAccountsAccountIdFk: foreignKey({
			name: 'sub_accounts_accountId_fk',
			columns: [table.accountId],
			foreignColumns: [account.id],
		}).onDelete('cascade'),
	}),
)

// ORM Relations

export const userRelations = relations(user, ({ many }) => ({
	accounts: many(account),
}))

export const accountRelations = relations(account, ({ one, many }) => ({
	owner: one(user, {
		fields: [account.ownerId],
		references: [user.id],
	}),
	subAccounts: many(subAccount),
}))

export const subAccountRelations = relations(subAccount, ({ one }) => ({
	account: one(account, {
		fields: [subAccount.accountId],
		references: [account.id],
	}),
}))
