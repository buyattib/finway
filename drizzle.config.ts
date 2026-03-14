import { defineConfig } from 'drizzle-kit'

import { STAGE_PRODUCTION } from './app/lib/constants'
import { env } from './app/utils-server/env.server'

if (!process.env.DB_FILE_NAME) {
	throw new Error('DB_FILE_NAME is required')
}

const PRODUCTION = env.NODE_ENV === STAGE_PRODUCTION

export default defineConfig({
	out: './drizzle/',
	schema: './database/schema.ts',
	dialect: PRODUCTION ? 'turso' : 'sqlite',
	dbCredentials: {
		url: process.env.DB_FILE_NAME,
		...(PRODUCTION && {
			authToken: process.env.TURSO_AUTH_TOKEN,
		}),
	},
})
