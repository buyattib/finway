import type { DB } from '~/lib/types'

export async function getSelectData(db: DB, ownerId: string) {
	const accounts = await db.query.account.findMany({
		where: (account, { eq }) => eq(account.ownerId, ownerId),
		orderBy: (account, { desc }) => [desc(account.createdAt)],
		columns: { id: true, name: true, accountType: true },
	})

	const currencies = await db.query.currency.findMany({
		columns: { id: true, code: true },
	})

	const transactionCategories = await db.query.transactionCategory.findMany({
		where: (transactionCategory, { eq }) =>
			eq(transactionCategory.ownerId, ownerId),
		orderBy: (transactionCategory, { desc }) => [
			desc(transactionCategory.createdAt),
		],
		columns: { id: true, name: true, description: true },
	})

	return {
		accounts,
		currencies,
		transactionCategories,
	}
}
