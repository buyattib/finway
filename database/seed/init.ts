import {
	ACCOUNT_TYPE_BANK,
	ACCOUNT_TYPE_CASH,
	CURRENCY_USD,
	CURRENCY_ARS,
} from '~/routes/accounts/lib/constants'

import * as schema from '../schema'
import { getDb } from './db'

const db = getDb(schema)

const [{ id: userId }] = await db
	.insert(schema.user)
	.values({ email: 'buyattib29@gmail.com' })
	.returning({ id: schema.user.id })

const accountIds = await db
	.insert(schema.account)
	.values([
		{
			ownerId: userId,
			name: 'Test account 1',
			accountType: ACCOUNT_TYPE_BANK,
		},
		{
			ownerId: userId,
			name: 'Test account 2',
			accountType: ACCOUNT_TYPE_CASH,
		},
	])
	.returning({ id: schema.account.id })

await db
	.insert(schema.wallet)
	.values(
		accountIds
			.map(({ id }) => {
				return [
					{
						accountId: id,
						balance: 10000,
						currency: CURRENCY_USD,
					} as const,
					{
						accountId: id,
						balance: 100000,
						currency: CURRENCY_ARS,
					} as const,
				]
			})
			.flat(),
	)
	.returning({ id: schema.wallet.id })

await db
	.insert(schema.transactionCategory)
	.values([
		{
			name: 'Test category 1',
			ownerId: userId,
		},
		{
			name: 'Test category 2',
			ownerId: userId,
		},
	])
	.returning({ id: schema.transactionCategory.id })
