import { and, eq, ne, inArray } from 'drizzle-orm'

import { account, subAccount } from '~/database/schema'
import { type DB } from '~/lib/types'
import { formatNumberWithoutCommas } from '~/lib/utils'

import type { TAccountType, TAccountFormSchema } from './types'

export async function getUserAccounts(db: DB, userId: string) {
	const result = await db.query.account.findMany({
		orderBy: (account, { desc }) => [desc(account.createdAt)],
		where: (account, { eq }) => eq(account.ownerId, userId),
		columns: { id: true, name: true, description: true, accountType: true },
		with: {
			subAccounts: {
				orderBy: (subAccount, { desc }) => [desc(subAccount.balance)],
				columns: { id: true, currency: true, balance: true },
			},
		},
	})

	const accounts = result.map(account => ({
		...account,
		subAccounts: account.subAccounts.map(sub => ({
			...sub,
			balance: String(sub.balance / 100),
		})),
	}))

	return accounts
}

export async function getAccount(db: DB, accountId: string) {
	const account = await db.query.account.findFirst({
		where: (account, { eq }) => eq(account.id, accountId),
		columns: {
			id: true,
			name: true,
			description: true,
			accountType: true,
			ownerId: true,
		},
		with: {
			subAccounts: {
				orderBy: (subAccount, { desc }) => [desc(subAccount.balance)],
				columns: { id: true, currency: true, balance: true },
			},
		},
	})

	if (!account) {
		return null
	}

	return {
		...account,
		subAccounts: account.subAccounts.map(sa => ({
			...sa,
			balance: String(sa.balance / 100),
		})),
	}
}

export async function getExistingAccountsCount(
	db: DB,
	{
		userId,
		name,
		accountType,
		accountId,
	}: {
		userId: string
		name: string
		accountType: TAccountType
		accountId?: string
	},
) {
	const filters = [
		eq(account.ownerId, userId),
		eq(account.name, name),
		eq(account.accountType, accountType),
	]
	if (accountId) {
		filters.push(ne(account.id, accountId))
	}

	return db.$count(account, and(...filters))
}

export async function createUserAccount(
	db: DB,
	userId: string,
	body: TAccountFormSchema,
) {
	const { subAccounts, ...accountData } = body

	return db.transaction(async tx => {
		const [{ id: accountId }] = await tx
			.insert(account)
			.values({ ...accountData, ownerId: userId })
			.returning({ id: account.id })

		await tx.insert(subAccount).values(
			subAccounts.map(sa => ({
				...sa,
				accountId,
				balance: Number(formatNumberWithoutCommas(sa.balance)) * 100,
			})),
		)

		return accountId
	})
}

export async function updateUserAccount(
	db: DB,
	accountId: string,
	body: TAccountFormSchema,
) {
	const { subAccounts, id: _, ...accountData } = body

	const existingSubAccounts = await db.query.subAccount.findMany({
		columns: { id: true },
		where: (subAccount, { eq }) => eq(subAccount.accountId, accountId),
	})

	const toCreate = subAccounts.filter(sa => !sa.id)
	const toDelete = existingSubAccounts
		.filter(esa => !subAccounts.find(sa => sa.id === esa.id))
		.map(esa => esa.id)

	await db.transaction(async tx => {
		await tx
			.update(account)
			.set(accountData)
			.where(eq(account.id, accountId))

		if (toCreate.length > 0) {
			await tx.insert(subAccount).values(
				toCreate.map(sa => ({
					...sa,
					accountId,
					balance:
						Number(formatNumberWithoutCommas(sa.balance)) * 100,
				})),
			)
		}
		if (toDelete.length > 0) {
			await tx.delete(subAccount).where(inArray(subAccount.id, toDelete))
		}
	})
}

export async function deleteAccount(db: DB, accountId: string) {
	return db.delete(account).where(eq(account.id, accountId))
}
