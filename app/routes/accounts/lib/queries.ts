import { and, eq, sql } from 'drizzle-orm'
import { transaction as transactionTable } from '~/database/schema'
import type { DB } from '~/lib/types'

import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
} from '~/routes/transactions/lib/constants'

export async function getAccountCurrencyBalance(
	db: DB,
	accountId: string,
	currencyId: string,
) {
	const [{ balance }] = await db
		.select({
			balance: sql<number>`COALESCE(
						SUM(
							CASE 
								WHEN ${transactionTable.type} = ${TRANSACTION_TYPE_INCOME} THEN ${transactionTable.amount}
								WHEN ${transactionTable.type} = ${TRANSACTION_TYPE_EXPENSE} THEN -${transactionTable.amount}
								ELSE 0
							END
						), 0)`,
		})
		.from(transactionTable)
		.where(
			and(
				eq(transactionTable.accountId, accountId),
				eq(transactionTable.currencyId, currencyId),
			),
		)

	return balance
}
