import { sql } from 'drizzle-orm'
import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { cuid2 } from 'drizzle-cuid2/sqlite'

const base = {
	createdAt: text()
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text()
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`)
		.$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
	deletedAt: text().$type<string | null>().default(null),
}

export const users = sqliteTable(
	'users',
	{
		...base,
		id: cuid2().defaultRandom().primaryKey(),
		email: text().notNull(),
	},
	table => [uniqueIndex('users_email_idx').on(table.email)],
	// table => ({
	// 	usersEmailIdx: uniqueIndex('users_email_idx').on(table.email),
	// }),
)
