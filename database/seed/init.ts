import {
	ACCOUNT_TYPE_BANK,
	ACCOUNT_TYPE_CASH,
	CURRENCY_USD,
	CURRENCY_ARS,
	CURRENCIES,
} from '~/routes/accounts/lib/constants'

import * as schema from '../schema'
import { getDb } from './db'

const db = getDb(schema)

await db.insert(schema.currency).values(CURRENCIES.map(code => ({ code })))

// const [{ id: userId }] = await db
// 	.insert(schema.user)
// 	.values({ email: 'buyattib29@gmail.com' })
// 	.returning({ id: schema.user.id })

// const accountIds = await db
// 	.insert(schema.account)
// 	.values([
// 		{
// 			ownerId: userId,
// 			name: 'Test account 1',
// 			accountType: ACCOUNT_TYPE_BANK,
// 		},
// 		{
// 			ownerId: userId,
// 			name: 'Test account 2',
// 			accountType: ACCOUNT_TYPE_CASH,
// 		},
// 	])
// 	.returning({ id: schema.account.id })

// await db
// 	.insert(schema.transactionCategory)
// 	.values([
// 		{
// 			name: 'Test category 1',
// 			ownerId: userId,
// 		},
// 		{
// 			name: 'Test category 2',
// 			ownerId: userId,
// 		},
// 	])
// 	.returning({ id: schema.transactionCategory.id })
