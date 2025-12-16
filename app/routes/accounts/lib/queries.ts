import { type DB } from '~/lib/types'

export async function getAccount(db: DB, id: string) {
	return db.query.account.findFirst({
		where: (account, { eq }) => eq(account.id, id),
		columns: {
			id: true,
			name: true,
			description: true,
			accountType: true,
			ownerId: true,
		},
		with: {
			wallets: {
				orderBy: (wallets, { desc }) => [desc(wallets.balance)],
				columns: { id: true, currency: true, balance: true },
			},
		},
	})
}
