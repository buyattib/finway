import { createRequestHandler } from '@react-router/express'
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import express from 'express'
import 'react-router'

import { DatabaseContext } from '~/database/context'
import * as schema from '~/database/schema'

declare module 'react-router' {
	interface AppLoadContext {
		VALUE_FROM_EXPRESS: string
	}
}

// This express app is the one that handles all incoming requests through RRv7
export const app = express()

if (!process.env.DB_FILE_NAME) throw new Error('DB_FILE_NAME is required')

// connect to db and add to context for loaders/actions to use
const client = createClient({ url: process.env.DB_FILE_NAME })
const db = drizzle(client, { schema })
app.use((_, __, next) => DatabaseContext.run(db, next))

// RRv7 request handler (analogous to defining the endpoints in an express api)
app.use(
	createRequestHandler({
		build: () => import('virtual:react-router/server-build'),
		getLoadContext() {
			return {
				VALUE_FROM_EXPRESS: 'Hello from Express',
			}
		},
	}),
)
