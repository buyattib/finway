import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { LibSQLTransaction } from 'drizzle-orm/libsql/session'
import type { ExtractTablesWithRelations } from 'drizzle-orm'

import * as schema from '~/database/schema'
import type { requireAuthenticated } from '~/utils-server/auth.server'

import { CURRENCIES } from './constants'
import { type getSelectData } from './queries'

export type DB =
	| LibSQLDatabase<typeof schema>
	| LibSQLTransaction<
			typeof schema,
			ExtractTablesWithRelations<typeof schema>
	  >

export type UserAuth = Awaited<ReturnType<typeof requireAuthenticated>>
export type TCurrency = (typeof CURRENCIES)[number]
export type TSelectData = Awaited<ReturnType<typeof getSelectData>>
