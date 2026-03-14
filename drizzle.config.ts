import { defineConfig } from 'drizzle-kit'

import { STAGE_PRODUCTION } from './app/lib/constants'
import { env } from './app/utils-server/env.server'

if (!env.DB_FILE_NAME) {
	throw new Error('DB_FILE_NAME is required')
}

const PRODUCTION = env.stage === STAGE_PRODUCTION

export default defineConfig({
	out: './drizzle/',
	schema: './database/schema.ts',
	dialect: PRODUCTION ? 'turso' : 'sqlite',
	dbCredentials: {
		url: env.DB_FILE_NAME,
		...(PRODUCTION && {
			authToken: env.TURSO_AUTH_TOKEN,
		}),
	},
})
