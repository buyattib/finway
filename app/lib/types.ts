import type { LibSQLDatabase } from 'drizzle-orm/libsql'

import * as schema from '~/database/schema'
import type { requireAuthenticated } from '~/utils-server/auth.server'

import { ACCOUNT_TYPES, CC_TRANSACTION_TYPES, CURRENCIES, TRANSACTION_TYPES } from './constants'
import { type getSelectData } from './queries'

export type UserAuth = Awaited<ReturnType<typeof requireAuthenticated>>
export type DB = LibSQLDatabase<typeof schema>

export type TAccountType = (typeof ACCOUNT_TYPES)[number]
export type TCurrency = (typeof CURRENCIES)[number]
export type TTransactionType = (typeof TRANSACTION_TYPES)[number]
export type TCCTransactionType = (typeof CC_TRANSACTION_TYPES)[number]

export type TAccountBalance = {
	id: string
	balance: string
	currency: TCurrency
}

export type TSelectData = Awaited<ReturnType<typeof getSelectData>>
