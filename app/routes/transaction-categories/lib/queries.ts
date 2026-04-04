import { and, eq } from 'drizzle-orm'

import { transactionCategory as transactionCategoryTable } from '~/database/schema'
import type { DB } from '~/lib/types'

export async function getTransactionCategories({
	db,
	ownerId,
}: {
	db: DB
	ownerId: string
}) {
	return db.query.transactionCategory.findMany({
		orderBy: (transactionCategory, { desc }) => [
			desc(transactionCategory.createdAt),
		],
		where: (transactionCategory, { eq }) =>
			eq(transactionCategory.ownerId, ownerId),
		columns: { id: true, name: true, description: true },
	})
}

export async function getTransactionCategoryById({
	db,
	transactionCategoryId,
}: {
	db: DB
	transactionCategoryId: string
}) {
	return db.query.transactionCategory.findFirst({
		where: (transactionCategory, { eq }) =>
			eq(transactionCategory.id, transactionCategoryId),
		columns: { id: true, ownerId: true },
	})
}

export async function getDuplicateTransactionCategoryCount({
	db,
	ownerId,
	name,
}: {
	db: DB
	ownerId: string
	name: string
}) {
	return db.$count(
		transactionCategoryTable,
		and(
			eq(transactionCategoryTable.ownerId, ownerId),
			eq(transactionCategoryTable.name, name),
		),
	)
}

export async function deleteTransactionCategory({
	db,
	transactionCategoryId,
}: {
	db: DB
	transactionCategoryId: string
}) {
	await db
		.delete(transactionCategoryTable)
		.where(eq(transactionCategoryTable.id, transactionCategoryId))
}

export async function createTransactionCategory({
	db,
	ownerId,
	name,
	description,
}: {
	db: DB
	ownerId: string
	name: string
	description: string
}) {
	await db
		.insert(transactionCategoryTable)
		.values({ name, description, ownerId })
}

export async function getExistingCategoriesByName({
	db,
	ownerId,
	categoryNames,
}: {
	db: DB
	ownerId: string
	categoryNames: string[]
}) {
	return db.query.transactionCategory.findMany({
		where: (tc, { eq, and, inArray }) =>
			and(eq(tc.ownerId, ownerId), inArray(tc.name, categoryNames)),
		columns: { name: true },
	})
}

export async function bulkCreateTransactionCategories({
	db,
	ownerId,
	names,
}: {
	db: DB
	ownerId: string
	names: string[]
}) {
	await db.insert(transactionCategoryTable).values(
		names.map(name => ({
			name,
			ownerId,
		})),
	)
}
