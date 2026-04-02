import type { LibSQLDatabase } from 'drizzle-orm/libsql'

import * as schema from '~/database/schema'
import type { requireAuthenticated } from '~/utils-server/auth.server'

import { CURRENCIES } from './constants'
import { type getSelectData } from './queries'

export type UserAuth = Awaited<ReturnType<typeof requireAuthenticated>>
export type DB = LibSQLDatabase<typeof schema>
export type TCurrency = (typeof CURRENCIES)[number]
export type TSelectData = Awaited<ReturnType<typeof getSelectData>>
