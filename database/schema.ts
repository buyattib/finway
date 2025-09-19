import { sql } from 'drizzle-orm'
import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { cuid2 } from 'drizzle-cuid2/sqlite'

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

export const users = sqliteTable(
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
