import { RouterContextProvider } from 'react-router'
import { createRequestHandler } from '@react-router/express'
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import express from 'express'

import * as schema from '~/database/schema'
import { env } from '~/utils-server/env.server'
import { dbContext, globalContext } from '~/lib/context'
import { STAGE_PRODUCTION } from '~/lib/constants'

declare global {
	var __libsql: ReturnType<typeof createClient> | undefined
}

// This express app is the one that handles all incoming requests through RRv7
export const app = express()

// connect to db and add to context for loaders/actions to use
let client
if (env.NODE_ENV === STAGE_PRODUCTION) {
	client = createClient({
		url: env.DB_FILE_NAME,
		authToken: env.TURSO_AUTH_TOKEN,
	})
} else {
	client =
		globalThis.__libsql ??
		createClient({
			url: env.DB_FILE_NAME,
		})
	globalThis.__libsql = client
}

const db = drizzle(client, {
	schema,
	logger: {
		logQuery(query) {
			const start = performance.now()
			const op = query.split(/\s+/)[0].toUpperCase()
			const table = query.match(/(?:from|into|update)\s+"?(\w+)"?/i)?.[1]
			const where = query
				.match(/where\s+(.+?)(?:\s+order|\s+limit|\s+group|\s*$)/i)?.[1]
				?.replace(/["`]/g, '')
			queueMicrotask(() => {
				const duration = (performance.now() - start).toFixed(2)
				const filter = where ? ` WHERE ${where}` : ''
				console.log(
					`  [DB] ${duration}ms - ${op} ${table ?? 'unknown'}${filter}`,
				)
			})
		},
	},
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
