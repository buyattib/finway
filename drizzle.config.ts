import { defineConfig } from 'drizzle-kit'

if (!process.env.DB_FILE_NAME) {
	throw new Error('DB_FILE_NAME is required')
}

export default defineConfig({
	out: './drizzle/',
	schema: './database/schema.ts',
	dialect: 'sqlite',
	dbCredentials: {
		url: process.env.DB_FILE_NAME,
	},
})
