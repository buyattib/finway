import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

export function getDb(schema: any) {
	const client = createClient({ url: process.env.DB_FILE_NAME! })
	const db = drizzle(client, { schema, logger: true })
	return db
}
