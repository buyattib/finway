import { and, eq, ne, inArray } from 'drizzle-orm'

// import {} from '~/database/schema'
import { type DB } from '~/lib/types'

export async function getUserTransactions(db: DB, userId: string) {
	const result = await db.query.transaction.findMany({
		orderBy: (transaction, { desc }) => [desc(transaction.date)],
		where: (transaction, { eq }) => eq(transaction.ownerId, userId),
		columns: { id: true, date: true, amount: true, type: true },
		with: {
			subAccount: {
				columns: { id: true, currency: true },
				with: {
					account: {
						columns: { id: true, name: true },
					},
				},
			},
			transactionCategory: {
				columns: { id: true, name: true },
			},
		},
	})

	const transactions = result.map(tx => ({
		...tx,
		amount: String(tx.amount / 100),
	}))

	return transactions
}
