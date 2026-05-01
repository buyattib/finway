import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
} from '~/features/transactions/constants'
import type { TTransactionType } from '~/features/transactions/types'

export function reduceStatementTotals(
	rows: Array<{
		currencyId: string
		currencyCode: string
		total: string | null
		type: TTransactionType
	}>,
) {
	const byCurrency = new Map<
		string,
		{ currencyCode: string; amountCents: number }
	>()
	for (const row of rows) {
		const amount = Number(row.total ?? 0)
		const signed = {
			[TRANSACTION_TYPE_EXPENSE]: amount,
			[TRANSACTION_TYPE_INCOME]: -amount,
		}[row.type]
		const existing = byCurrency.get(row.currencyId)
		byCurrency.set(row.currencyId, {
			currencyCode: row.currencyCode,
			amountCents: (existing?.amountCents ?? 0) + signed,
		})
	}
	return Array.from(byCurrency, ([currencyId, v]) => ({
		currencyId,
		currencyCode: v.currencyCode,
		amountCents: v.amountCents,
	}))
}
