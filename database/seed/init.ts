import {
	ACCOUNT_TYPE_BANK,
	ACCOUNT_TYPE_CASH,
	CURRENCY_USD,
} from '~/routes/accounts/lib/constants'
import { TRANSACTION_TYPE_EXPENSE } from '~/routes/transactions/lib/constants'

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

const walletIds = await db
	.insert(schema.wallet)
	.values(
		accountIds.map(({ id }) => {
			return {
				accountId: id,
				balance: 10000,
				currency: CURRENCY_USD,
			} as const
		}),
	)
	.returning({ id: schema.wallet.id })

const transactionCategoryIds = await db
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

const ids: Array<{ walletId: string; transactionCategoryId: string }> = []
walletIds.forEach(({ id }) => {
	transactionCategoryIds.forEach(({ id: txcId }) => {
		ids.push({ walletId: id, transactionCategoryId: txcId })
	})
})

const transactionsData = ids.map(({ walletId, transactionCategoryId }) => {
	return {
		date: new Date().toISOString(),
		amount: 1000,
		type: TRANSACTION_TYPE_EXPENSE,
		walletId,
		transactionCategoryId,
	} as const
})

await db.insert(schema.transaction).values(transactionsData)
