import { and, asc, desc, eq, gt, lt, lte, sum, ne } from 'drizzle-orm'

import {
	creditCard as creditCardTable,
	creditCardTransaction as creditCardTransactionTable,
	creditCardTransactionInstallment as creditCardTransactionInstallmentTable,
	creditCardStatement as creditCardStatementTable,
	account as accountTable,
	currency as currencyTable,
} from '~/database/schema'
import type { DB } from '~/lib/types'
import { addMonth, subtractMonth, initializeDate } from '~/lib/utils'

import { ACCOUNT_TYPE_CREDIT_CARD } from '~/routes/accounts/lib/constants'
import { createAccount } from '~/routes/accounts/lib/queries'
import type { TCategory } from '~/routes/transactions/lib/types'

import type { TCCTransactionType } from './types'

// fetch --------

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
			institution: true,
			accountId: true,
		},
		with: {
			account: {
				columns: { ownerId: true },
			},
		},
	})
}

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
			institution: creditCardTable.institution,
		})
		.from(creditCardTable)
		.innerJoin(accountTable, eq(creditCardTable.accountId, accountTable.id))
		.where(eq(accountTable.ownerId, ownerId))
		.orderBy(desc(creditCardTable.createdAt))
}

export async function validateExistingCreditCard({
	db,
	ownerId,
	brand,
	last4,
	institution,
	excludeId,
}: {
	db: DB
	ownerId: string
	brand: string
	last4: string
	institution: string
	excludeId?: string
}) {
	const filters = [
		eq(accountTable.ownerId, ownerId),
		eq(creditCardTable.last4, last4),
		eq(creditCardTable.brand, brand),
		eq(creditCardTable.institution, institution),
	]
	if (excludeId) {
		filters.push(ne(creditCardTable.id, excludeId))
	}
	return db.$count(
		db
			.select()
			.from(creditCardTable)
			.innerJoin(
				accountTable,
				eq(creditCardTable.accountId, accountTable.id),
			)
			.where(and(...filters)),
	)
}

export async function getStatementByDate({
	db,
	creditCardId,
	date,
}: {
	db: DB
	creditCardId: string
	date: Date
}) {
	return db.query.creditCardStatement.findFirst({
		where: (s, { eq, gte, and }) =>
			and(
				eq(s.creditCardId, creditCardId),
				gte(s.closingDate, date.toISOString()),
			),
		orderBy: (s, { asc }) => [asc(s.closingDate)],
	})
}

export async function getStatementsFromDate({
	db,
	creditCardId,
	date,
	limit,
}: {
	db: DB
	creditCardId: string
	date: string
	limit: number
}) {
	return db.query.creditCardStatement.findMany({
		where: (s, { eq, gte, and }) =>
			and(eq(s.creditCardId, creditCardId), gte(s.closingDate, date)),
		orderBy: (s, { asc }) => [asc(s.closingDate)],
		limit,
	})
}

export async function getCreditCardTransactions({
	db,
	creditCardId,
	type,
	category,
	page,
	pageSize,
}: {
	db: DB
	creditCardId: string
	type: TCCTransactionType | ''
	category: TCategory
	page: number
	pageSize: number
}) {
	const filters = [eq(creditCardTransactionTable.creditCardId, creditCardId)]
	if (type) {
		filters.push(eq(creditCardTransactionTable.type, type))
	}
	if (category) {
		filters.push(eq(creditCardTransactionTable.category, category))
	}

	const transactionsQuery = db
		.select({
			id: creditCardTransactionTable.id,
			date: creditCardTransactionTable.date,
			type: creditCardTransactionTable.type,
			amount: creditCardTransactionTable.amount,
			description: creditCardTransactionTable.description,
			category: creditCardTransactionTable.category,
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
			currencyId: true,
			category: true,
		},
		with: {
			creditCard: {
				columns: { id: true },
			},
			currency: {
				columns: { code: true },
			},
		},
	})
}

export async function getTransactionInstallmentCount({
	db,
	transactionId,
}: {
	db: DB
	transactionId: string
}) {
	return db.$count(
		creditCardTransactionInstallmentTable,
		eq(
			creditCardTransactionInstallmentTable.creditCardTransactionId,
			transactionId,
		),
	)
}

export async function getTransactionInstallments({
	db,
	transactionId,
	maxClosingDate,
}: {
	db: DB
	transactionId: string
	maxClosingDate: string
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
			and(
				eq(
					creditCardTransactionInstallmentTable.creditCardTransactionId,
					transactionId,
				),
				lte(creditCardStatementTable.closingDate, maxClosingDate),
			),
		)
		.orderBy(desc(creditCardTransactionInstallmentTable.installmentNumber))
}

export async function getCreditCardStatements({
	db,
	creditCardId,
	maxClosingDate,
	page,
	pageSize,
}: {
	db: DB
	creditCardId: string
	maxClosingDate: string
	page: number
	pageSize: number
}) {
	const whereFilter = and(
		eq(creditCardStatementTable.creditCardId, creditCardId),
		lte(creditCardStatementTable.closingDate, maxClosingDate),
	)

	const statements = await db.query.creditCardStatement.findMany({
		where: whereFilter,
		orderBy: (s, { desc }) => [desc(s.closingDate)],
		limit: pageSize,
		offset: (page - 1) * pageSize,
		columns: {
			id: true,
			closingDate: true,
			dueDate: true,
		},
		with: {
			installments: {
				columns: { amount: true },
				with: {
					creditCardTransaction: {
						columns: {},
						with: {
							currency: { columns: { code: true } },
						},
					},
				},
			},
		},
	})

	const total = await db.$count(
		db
			.select({ id: creditCardStatementTable.id })
			.from(creditCardStatementTable)
			.where(whereFilter),
	)

	return { statements, total }
}

export async function getStatementById({
	db,
	statementId,
}: {
	db: DB
	statementId: string
}) {
	return db.query.creditCardStatement.findFirst({
		where: (s, { eq }) => eq(s.id, statementId),
	})
}

export async function getStatementTotalsByCurrency({
	db,
	statementId,
}: {
	db: DB
	statementId: string
}) {
	return db
		.select({
			currencyCode: currencyTable.code,
			total: sum(creditCardTransactionInstallmentTable.amount),
		})
		.from(creditCardTransactionInstallmentTable)
		.innerJoin(
			creditCardTransactionTable,
			eq(
				creditCardTransactionInstallmentTable.creditCardTransactionId,
				creditCardTransactionTable.id,
			),
		)
		.innerJoin(
			currencyTable,
			eq(creditCardTransactionTable.currencyId, currencyTable.id),
		)
		.where(
			eq(creditCardTransactionInstallmentTable.statementId, statementId),
		)
		.groupBy(currencyTable.code)
}

export async function getStatementInstallments({
	db,
	statementId,
	page,
	pageSize,
}: {
	db: DB
	statementId: string
	page: number
	pageSize: number
}) {
	const installmentsQuery = db
		.select({
			id: creditCardTransactionInstallmentTable.id,
			installmentNumber:
				creditCardTransactionInstallmentTable.installmentNumber,
			amount: creditCardTransactionInstallmentTable.amount,
			transactionId: creditCardTransactionTable.id,
			transactionDate: creditCardTransactionTable.date,
			transactionType: creditCardTransactionTable.type,
			transactionDescription: creditCardTransactionTable.description,
			category: creditCardTransactionTable.category,
			currencyCode: currencyTable.code,
			totalInstallments: db.$count(
				creditCardTransactionInstallmentTable,
				eq(
					creditCardTransactionTable.id,
					creditCardTransactionInstallmentTable.creditCardTransactionId,
				),
			),
		})
		.from(creditCardTransactionInstallmentTable)
		.innerJoin(
			creditCardTransactionTable,
			eq(
				creditCardTransactionInstallmentTable.creditCardTransactionId,
				creditCardTransactionTable.id,
			),
		)
		.innerJoin(
			currencyTable,
			eq(creditCardTransactionTable.currencyId, currencyTable.id),
		)
		.where(
			eq(creditCardTransactionInstallmentTable.statementId, statementId),
		)
		.orderBy(desc(creditCardTransactionTable.date))

	const total = await db.$count(installmentsQuery)
	const installments = await installmentsQuery
		.limit(pageSize)
		.offset((page - 1) * pageSize)

	return { installments, total }
}

export async function getLatestStatement({
	db,
	creditCardId,
}: {
	db: DB
	creditCardId: string
}) {
	return db.query.creditCardStatement.findFirst({
		where: (s, { eq }) => eq(s.creditCardId, creditCardId),
		orderBy: (s, { desc }) => [desc(s.closingDate)],
	})
}

export async function getEarliestStatement({
	db,
	creditCardId,
}: {
	db: DB
	creditCardId: string
}) {
	return db.query.creditCardStatement.findFirst({
		where: (s, { eq }) => eq(s.creditCardId, creditCardId),
		orderBy: (s, { asc }) => [asc(s.closingDate)],
	})
}

export async function getAdjacentStatements({
	db,
	creditCardId,
	closingDate,
}: {
	db: DB
	creditCardId: string
	closingDate: string
}) {
	const [previous, next] = await Promise.all([
		db.query.creditCardStatement.findFirst({
			where: (s, { and: _and, eq: _eq }) =>
				_and(
					_eq(s.creditCardId, creditCardId),
					lt(s.closingDate, closingDate),
				),
			orderBy: s => [desc(s.closingDate)],
		}),
		db.query.creditCardStatement.findFirst({
			where: (s, { and: _and, eq: _eq }) =>
				_and(
					_eq(s.creditCardId, creditCardId),
					gt(s.closingDate, closingDate),
				),
			orderBy: s => [asc(s.closingDate)],
		}),
	])

	return { previous, next }
}

// mutations --------

export async function ensureStatementsExist({
	db,
	creditCardId,
	date,
}: {
	db: DB
	creditCardId: string
	date: Date
}) {
	await db.transaction(async tx => {
		const latestStatement = await getLatestStatement({
			db: tx,
			creditCardId,
		})
		if (!latestStatement) {
			throw new Error('No latest statement found for credit card')
		}

		const newStatements = []

		// Generate future statements
		let lastClosing = latestStatement.closingDate
		let lastDue = latestStatement.dueDate
		while (new Date(lastClosing) < date) {
			lastClosing = addMonth(lastClosing)
			lastDue = addMonth(lastDue)
			newStatements.push({
				closingDate: lastClosing,
				dueDate: lastDue,
				creditCardId,
			})
		}

		const earliestStatement = await getEarliestStatement({
			db: tx,
			creditCardId,
		})
		if (!earliestStatement) {
			throw new Error('No earliest statement found for credit card')
		}

		// Generate past statements
		let firstClosing = earliestStatement.closingDate
		let firstDue = earliestStatement.dueDate
		while (new Date(firstClosing) > date) {
			firstClosing = subtractMonth(firstClosing)
			firstDue = subtractMonth(firstDue)
			newStatements.push({
				closingDate: firstClosing,
				dueDate: firstDue,
				creditCardId,
			})
		}

		if (newStatements.length > 0) {
			await tx.insert(creditCardStatementTable).values(newStatements)
		}
	})
}

// CC
export async function createCreditCard({
	db,
	ownerId,
	creditCardData,
}: {
	db: DB
	ownerId: string
	creditCardData: {
		last4: string
		brand: string
		expiryMonth: string
		expiryYear: string
		institution: string
	}
}) {
	// Initialize dates for first statement
	const currentClosingDate = initializeDate()
	const currentDueDate = initializeDate({
		day: currentClosingDate.getUTCDate() + 10,
	})

	return await db.transaction(async tx => {
		const name = `${creditCardData.brand}-${creditCardData.last4}-${creditCardData.institution}`
		const accountId = await createAccount({
			db: tx,
			ownerId,
			name,
			accountType: ACCOUNT_TYPE_CREDIT_CARD,
			description: '',
		})

		const [{ id: creditCardId }] = await tx
			.insert(creditCardTable)
			.values({ ...creditCardData, accountId })
			.returning({ id: creditCardTable.id })

		await tx.insert(creditCardStatementTable).values({
			closingDate: currentClosingDate.toISOString(),
			dueDate: currentDueDate.toISOString(),
			creditCardId,
		})

		return creditCardId
	})
}

export async function updateCreditCard({
	db,
	id,
	accountId,
	creditCardData,
}: {
	db: DB
	id: string
	accountId: string
	creditCardData: {
		last4: string
		brand: string
		expiryMonth: string
		expiryYear: string
		institution: string
	}
}) {
	await db.transaction(async tx => {
		const name = `${creditCardData.brand}-${creditCardData.last4}-${creditCardData.institution}`
		await tx
			.update(accountTable)
			.set({ name })
			.where(eq(accountTable.id, accountId))

		await tx
			.update(creditCardTable)
			.set(creditCardData)
			.where(eq(creditCardTable.id, id))
	})
}

export async function deleteCreditCard({
	db,
	accountId,
}: {
	db: DB
	accountId: string
}) {
	// Cascades the deletion to the credit card
	await db.delete(accountTable).where(eq(accountTable.id, accountId))
}

// statement
export async function updateStatement({
	db,
	statementId,
	body,
}: {
	db: DB
	statementId: string
	body: { closingDate: string; dueDate: string }
}) {
	await db
		.update(creditCardStatementTable)
		.set(body)
		.where(eq(creditCardStatementTable.id, statementId))
}

// cc transactions
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

export async function updateCreditCardTransaction({
	db,
	creditCardTransactionId,
	transactionData,
	installments,
}: {
	db: DB
	creditCardTransactionId: string
	transactionData: {
		date: string
		type: TCCTransactionType
		amount: number
		description: string
		currencyId: string
		category: TCategory
	}
	installments: Array<{
		installmentNumber: number
		amount: number
		statementId: string
	}>
}) {
	await db.transaction(async tx => {
		await tx
			.update(creditCardTransactionTable)
			.set(transactionData)
			.where(eq(creditCardTransactionTable.id, creditCardTransactionId))

		await tx
			.delete(creditCardTransactionInstallmentTable)
			.where(
				eq(
					creditCardTransactionInstallmentTable.creditCardTransactionId,
					creditCardTransactionId,
				),
			)

		await tx.insert(creditCardTransactionInstallmentTable).values(
			installments.map(i => ({
				...i,
				creditCardTransactionId,
			})),
		)
	})
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
		category: TCategory
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

		await tx.insert(creditCardTransactionInstallmentTable).values(
			installments.map(i => ({
				...i,
				creditCardTransactionId,
			})),
		)
	})
}
