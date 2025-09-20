import { cuid2 } from 'drizzle-cuid2/sqlite'
import { relations, sql } from 'drizzle-orm'
import {
	sqliteTable,
	text,
	integer,
	uniqueIndex,
} from 'drizzle-orm/sqlite-core'

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

export const account = sqliteTable('accounts', {
	...base,
	id: cuid2().defaultRandom().primaryKey(),
	name: text().notNull(),
	description: text(),
	accountType: text().notNull(),

	ownerId: text()
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
})

export const accountCurrency = sqliteTable('account_currencies', {
	...base,
	id: cuid2().defaultRandom().primaryKey(),
	balance: integer().notNull(),
	currency: text().notNull(),

	accountId: text()
		.notNull()
		.references(() => account.id, { onDelete: 'cascade' }),
})

// ORM Relations

export const userRelations = relations(user, ({ many }) => ({
	accounts: many(account),
}))

export const accountRelations = relations(account, ({ one, many }) => ({
	owner: one(user, {
		fields: [account.ownerId],
		references: [user.id],
	}),
	accountCurrencies: many(accountCurrency),
}))

export const accountCurrencyRelations = relations(
	accountCurrency,
	({ one }) => ({
		account: one(account, {
			fields: [accountCurrency.accountId],
			references: [account.id],
		}),
	}),
)
