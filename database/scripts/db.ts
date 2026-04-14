import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { env } from '~/utils-server/env.server'
import { STAGE_PRODUCTION } from '~/lib/constants'

const PRODUCTION = env.stage === STAGE_PRODUCTION

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDb(schema: any) {
	const client = createClient({
		url: env.DB_FILE_NAME,
		...(PRODUCTION && { authToken: process.env.TURSO_AUTH_TOKEN }),
	})

	const db = drizzle(client, { schema, logger: true })
	return db
}
