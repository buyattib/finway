// import { integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// const timestamps = {
// 	createdAt: timestamp().defaultNow().notNull(),
// 	updatedAt: timestamp(),
// 	deletedAt: timestamp(),
// }

export const users = sqliteTable('users', {
	// ...timestamps,
	id: int().primaryKey({ autoIncrement: true }),
	email: text().notNull().unique(),
})
