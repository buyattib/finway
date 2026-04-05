import { and, desc, eq } from 'drizzle-orm'

import {
	creditCard as creditCardTable,
	creditCardTransaction as creditCardTransactionTable,
	creditCardTransactionInstallment as creditCardTransactionInstallmentTable,
	creditCardStatement as creditCardStatementTable,
	account as accountTable,
	transactionCategory as transactionCategoryTable,
	currency as currencyTable,
} from '~/database/schema'
import type { DB } from '~/lib/types'
import type { TCCTransactionType } from './types'

// fetch --------

export async function getCreditCards({
	db,
	ownerId,
}: {
	db: DB
	ownerId: string
}) {
	return db
		.select({
			id: creditCardTable.id,
			last4: creditCardTable.last4,
			brand: creditCardTable.brand,
			expiryMonth: creditCardTable.expiryMonth,
			expiryYear: creditCardTable.expiryYear,
			accountName: accountTable.name,
		})
		.from(creditCardTable)
		.innerJoin(accountTable, eq(creditCardTable.accountId, accountTable.id))
		.where(eq(accountTable.ownerId, ownerId))
		.orderBy(desc(creditCardTable.createdAt))
}

export async function getCreditCardById({
	db,
	creditCardId,
}: {
	db: DB
	creditCardId: string
}) {
	return db.query.creditCard.findFirst({
		where: (creditCard, { eq }) => eq(creditCard.id, creditCardId),
		columns: {
			id: true,
			brand: true,
			last4: true,
			expiryMonth: true,
			expiryYear: true,
			accountId: true,
		},
		with: {
			account: {
				columns: { name: true, ownerId: true },
			},
			statements: {
				orderBy: (s, { desc }) => [desc(s.closingDate)],
				limit: 1,
				columns: { closingDate: true, dueDate: true },
			},
		},
	})
}

export async function getCurrentStatement({
	db,
	creditCardId,
}: {
	db: DB
	creditCardId: string
}) {
	return db.query.creditCardStatement.findFirst({
		where: (s, { eq, gte, and }) =>
			and(
				eq(s.creditCardId, creditCardId),
				gte(s.closingDate, new Date().toISOString()),
			),
		orderBy: (s, { asc }) => [asc(s.closingDate)],
	})
}

export async function getCreditCardTransactions({
	db,
	creditCardId,
	type,
	categoryId,
	page,
	pageSize,
}: {
	db: DB
	creditCardId: string
	type: TCCTransactionType | ''
	categoryId: string
	page: number
	pageSize: number
}) {
	const filters = [eq(creditCardTransactionTable.creditCardId, creditCardId)]
	if (type) {
		filters.push(eq(creditCardTransactionTable.type, type))
	}
	if (categoryId) {
		filters.push(
			eq(creditCardTransactionTable.transactionCategoryId, categoryId),
		)
	}

	const transactionsQuery = db
		.select({
			id: creditCardTransactionTable.id,
			date: creditCardTransactionTable.date,
			type: creditCardTransactionTable.type,
			amount: creditCardTransactionTable.amount,
			description: creditCardTransactionTable.description,
			categoryName: transactionCategoryTable.name,
			currencyCode: currencyTable.code,
			installments: db.$count(
				creditCardTransactionInstallmentTable,
				eq(
					creditCardTransactionTable.id,
					creditCardTransactionInstallmentTable.creditCardTransactionId,
				),
			),
		})
		.from(creditCardTransactionTable)
		.innerJoin(
			transactionCategoryTable,
			eq(
				creditCardTransactionTable.transactionCategoryId,
				transactionCategoryTable.id,
			),
		)
		.innerJoin(
			currencyTable,
			eq(creditCardTransactionTable.currencyId, currencyTable.id),
		)
		.innerJoin(
			creditCardTransactionInstallmentTable,
			eq(
				creditCardTransactionTable.id,
				creditCardTransactionInstallmentTable.creditCardTransactionId,
			),
		)
		.where(and(...filters))
		.groupBy(creditCardTransactionTable.id)
		.orderBy(
			desc(creditCardTransactionTable.date),
			desc(creditCardTransactionTable.createdAt),
		)

	const total = await db.$count(transactionsQuery)
	const transactions = await transactionsQuery
		.limit(pageSize)
		.offset((page - 1) * pageSize)

	return { transactions, total }
}

export async function getCreditCardTransactionById({
	db,
	transactionId,
}: {
	db: DB
	transactionId: string
}) {
	return db.query.creditCardTransaction.findFirst({
		where: (tx, { eq }) => eq(tx.id, transactionId),
		columns: {
			id: true,
			date: true,
			type: true,
			amount: true,
			description: true,
		},
		with: {
			creditCard: {
				columns: { id: true },
			},
			currency: {
				columns: { code: true },
			},
			transactionCategory: {
				columns: { name: true },
			},
		},
	})
}

export async function getTransactionInstallments({
	db,
	transactionId,
}: {
	db: DB
	transactionId: string
}) {
	return db
		.select({
			installmentNumber:
				creditCardTransactionInstallmentTable.installmentNumber,
			amount: creditCardTransactionInstallmentTable.amount,
			date: creditCardStatementTable.dueDate,
		})
		.from(creditCardTransactionInstallmentTable)
		.innerJoin(
			creditCardStatementTable,
			eq(
				creditCardTransactionInstallmentTable.statementId,
				creditCardStatementTable.id,
			),
		)
		.where(
			eq(
				creditCardTransactionInstallmentTable.creditCardTransactionId,
				transactionId,
			),
		)
		.orderBy(creditCardTransactionInstallmentTable.installmentNumber)
}

// mutations --------

export async function createCreditCard({
	db,
	creditCardData,
	currentClosingDate,
	currentDueDate,
}: {
	db: DB
	creditCardData: {
		last4: string
		brand: string
		expiryMonth: string
		expiryYear: string
		accountId: string
	}
	currentClosingDate: string
	currentDueDate: string
}) {
	const [{ id: creditCardId }] = await db
		.insert(creditCardTable)
		.values(creditCardData)
		.returning({ id: creditCardTable.id })

	await db.insert(creditCardStatementTable).values({
		closingDate: currentClosingDate,
		dueDate: currentDueDate,
		creditCardId,
	})

	return creditCardId
}

export async function updateCreditCard({
	db,
	id,
	body,
}: {
	db: DB
	id: string
	body: Record<string, unknown>
}) {
	await db.update(creditCardTable).set(body).where(eq(creditCardTable.id, id))
}

export async function deleteCreditCard({
	db,
	creditCardId,
}: {
	db: DB
	creditCardId: string
}) {
	await db
		.delete(creditCardTable)
		.where(eq(creditCardTable.id, creditCardId))
}

export async function deleteCreditCardTransaction({
	db,
	creditCardTransactionId,
}: {
	db: DB
	creditCardTransactionId: string
}) {
	await db
		.delete(creditCardTransactionTable)
		.where(eq(creditCardTransactionTable.id, creditCardTransactionId))
}

export async function createCreditCardTransaction({
	db,
	transactionData,
	creditCardId,
	installments,
}: {
	db: DB
	transactionData: {
		date: string
		type: TCCTransactionType
		amount: number
		description: string
		currencyId: string
		transactionCategoryId: string
	}
	creditCardId: string
	installments: Array<{
		installmentNumber: number
		amount: number
		statementId: string
	}>
}) {
	await db.transaction(async tx => {
		const [{ id: creditCardTransactionId }] = await tx
			.insert(creditCardTransactionTable)
			.values({
				...transactionData,
				creditCardId,
			})
			.returning({ id: creditCardTransactionTable.id })

		await tx
			.insert(creditCardTransactionInstallmentTable)
			.values(
				installments.map(i => ({
					...i,
					creditCardTransactionId,
				})),
			)
	})
}
