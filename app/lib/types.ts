import type { LibSQLDatabase } from 'drizzle-orm/libsql'

import * as schema from '~/database/schema'
import type { requireAuthenticated } from '~/server-utils/auth.server'

export type UserAuth = Awaited<ReturnType<typeof requireAuthenticated>>
export type DB = LibSQLDatabase<typeof schema>
