import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { env } from '~/utils-server/env.server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDb(schema: any) {
	const client = createClient({ url: env.DB_FILE_NAME })
	const db = drizzle(client, { schema, logger: true })
	return db
}
