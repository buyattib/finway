import { RouterContextProvider } from 'react-router'
import { createRequestHandler } from '@react-router/express'
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import express from 'express'

import { dbContext, globalContext } from '~/lib/context'
import * as schema from '~/database/schema'

declare global {
	var __libsql: ReturnType<typeof createClient> | undefined
}

// This express app is the one that handles all incoming requests through RRv7
export const app = express()

if (!process.env.DB_FILE_NAME) throw new Error('DB_FILE_NAME is required')

// connect to db and add to context for loaders/actions to use
const client =
	globalThis.__libsql ?? createClient({ url: process.env.DB_FILE_NAME })
if (process.env.NODE_ENV === 'development') {
	globalThis.__libsql = client
}
const db = drizzle(client, {
	schema,
	logger: process.env.NODE_ENV === 'development',
})

// RRv7 request handler (analogous to defining the endpoints in an express api)
app.use(
	createRequestHandler({
		build: () => import('virtual:react-router/server-build'),
		getLoadContext(_, res) {
			const context = new RouterContextProvider()
			context.set(globalContext, {
				cspNonce: res.locals.cspNonce,
			})

			context.set(dbContext, db)

			return context
		},
	}),
)
