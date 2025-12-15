import { and, eq } from 'drizzle-orm'

import { transactionCategory } from '~/database/schema'
import { type DB } from '~/lib/types'

import type { TTransactionCategoryFormSchema } from './types'

export async function getTransactionCategory(
	db: DB,
	transactionCategoryId: string,
) {
	return db.query.transactionCategory.findFirst({
		where: (category, { eq }) => eq(category.id, transactionCategoryId),
		columns: { id: true, name: true, description: true, ownerId: true },
	})
}

export async function getUserTransactionCategories(db: DB, userId: string) {
	const categories = await db.query.transactionCategory.findMany({
		orderBy: (category, { desc }) => [desc(category.createdAt)],
		where: (category, { eq }) => eq(category.ownerId, userId),
		columns: { id: true, name: true, description: true },
	})

	return categories
}

export async function getExistingCategoriesCount(
	db: DB,
	{
		userId,
		name,
	}: {
		userId: string
		name: string
	},
) {
	const filters = [
		eq(transactionCategory.ownerId, userId),
		eq(transactionCategory.name, name),
	]

	return db.$count(transactionCategory, and(...filters))
}

export async function createUserCategory(
	db: DB,
	userId: string,
	body: TTransactionCategoryFormSchema,
) {
	return db.insert(transactionCategory).values({
		name: body.name,
		description: body.description,
		ownerId: userId,
	})
}

export async function deleteTransactionCategory(
	db: DB,
	transactionCategoryId: string,
) {
	return db
		.delete(transactionCategory)
		.where(eq(transactionCategory.id, transactionCategoryId))
}
