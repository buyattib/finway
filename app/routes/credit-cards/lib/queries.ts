import {
	and,
	asc,
	desc,
	eq,
	gt,
	lt,
	lte,
	sum,
	ne,
	inArray,
	count,
} from 'drizzle-orm'

import * as schema from '~/database/schema'
import type { DB } from '~/lib/types'
import { addMonth, initializeDate, subtractMonth } from '~/lib/utils'

import type { TCategory, TTransactionType } from '~/features/transactions/types'
import { ACCOUNT_TYPE_CREDIT_CARD } from '~/routes/accounts/lib/constants'

// cc

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
		const [{ id: accountId }] = await tx
			.insert(schema.account)
			.values({
				name: '',
				accountType: ACCOUNT_TYPE_CREDIT_CARD,
				ownerId,
			})
			.returning({ id: schema.account.id })

		const [{ id: creditCardId }] = await tx
			.insert(schema.creditCard)
			.values({ ...creditCardData, accountId })
			.returning({ id: schema.creditCard.id })

		await tx.insert(schema.creditCardStatement).values({
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
	creditCardData,
}: {
	db: DB
	id: string
	creditCardData: {
		last4: string
		brand: string
		expiryMonth: string
		expiryYear: string
		institution: string
	}
}) {
	await db.transaction(async tx => {
		await tx
			.update(schema.creditCard)
			.set(creditCardData)
			.where(eq(schema.creditCard.id, id))
	})
}

export async function deleteCreditCard({ db, id }: { db: DB; id: string }) {
	await db.delete(schema.creditCard).where(eq(schema.creditCard.id, id))
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
			id: schema.creditCard.id,
			last4: schema.creditCard.last4,
			brand: schema.creditCard.brand,
			expiryMonth: schema.creditCard.expiryMonth,
			expiryYear: schema.creditCard.expiryYear,
			institution: schema.creditCard.institution,
		})
		.from(schema.creditCard)
		.innerJoin(
			schema.account,
			eq(schema.creditCard.accountId, schema.account.id),
		)
		.where(eq(schema.account.ownerId, ownerId))
		.orderBy(desc(schema.creditCard.createdAt))
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
		eq(schema.account.ownerId, ownerId),
		eq(schema.creditCard.last4, last4),
		eq(schema.creditCard.brand, brand),
		eq(schema.creditCard.institution, institution),
	]
	if (excludeId) {
		filters.push(ne(schema.creditCard.id, excludeId))
	}
	const [row] = await db
		.select({ c: count() })
		.from(schema.creditCard)
		.innerJoin(
			schema.account,
			eq(schema.creditCard.accountId, schema.account.id),
		)
		.where(and(...filters))
	return row.c
}

// statements

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
			await tx.insert(schema.creditCardStatement).values(newStatements)
		}
	})
}

export async function updateStatementDueDate({
	db,
	statementId,
	dueDate,
}: {
	db: DB
	statementId: string
	dueDate: string
}) {
	await db
		.update(schema.creditCardStatement)
		.set({ dueDate })
		.where(eq(schema.creditCardStatement.id, statementId))
}

export async function updateStatementClosingDate({
	db,
	creditCardId,
	statementId,
	nextStatementId,
	closingDate,
}: {
	db: DB
	creditCardId: string
	statementId: string
	nextStatementId?: string
	closingDate: string
}) {
	await db.transaction(async tx => {
		await tx
			.update(schema.creditCardStatement)
			.set({ closingDate })
			.where(eq(schema.creditCardStatement.id, statementId))

		const ccTransactionInstallmentCount = tx
			.select({
				id: schema.creditCardTransaction.id,
				installmentCount: count(
					schema.creditCardTransactionInstallment.id,
				).as('installmentCount'),
			})
			.from(schema.creditCardTransaction)
			.innerJoin(
				schema.creditCardTransactionInstallment,
				eq(
					schema.creditCardTransactionInstallment
						.creditCardTransactionId,
					schema.creditCardTransaction.id,
				),
			)
			.groupBy(schema.creditCardTransaction.id)
			.as('ccTransactionInstallmentCount')

		const statementIds = [statementId]
		if (nextStatementId) statementIds.push(nextStatementId)

		// Get all cc transaction ids that have an installment in the statement
		const statementsCCTransactions = await tx
			.selectDistinct({
				id: schema.creditCardTransaction.id,
				date: schema.creditCardTransaction.date,
				amount: schema.creditCardTransaction.amount,
				installmentCount:
					ccTransactionInstallmentCount.installmentCount,
			})
			.from(schema.creditCardTransactionInstallment)
			.innerJoin(
				schema.creditCardTransaction,
				eq(
					schema.creditCardTransactionInstallment
						.creditCardTransactionId,
					schema.creditCardTransaction.id,
				),
			)
			.innerJoin(
				ccTransactionInstallmentCount,
				eq(
					ccTransactionInstallmentCount.id,
					schema.creditCardTransaction.id,
				),
			)
			.where(
				inArray(
					schema.creditCardTransactionInstallment.statementId,
					statementIds,
				),
			)

		if (!statementsCCTransactions.length) return

		// Delete all installments from cc transactions which have an installment in the statement
		await tx.delete(schema.creditCardTransactionInstallment).where(
			inArray(
				schema.creditCardTransactionInstallment.creditCardTransactionId,
				statementsCCTransactions.map(t => t.id),
			),
		)

		// Recreate the installments for each transaction
		for (const {
			id,
			amount,
			date,
			installmentCount,
		} of statementsCCTransactions) {
			const installments = await makeTransactionInstallments({
				db: tx,
				creditCardId,
				amount,
				transactionDate: new Date(date),
				installmentCount,
			})

			await tx.insert(schema.creditCardTransactionInstallment).values(
				installments.map(i => ({
					...i,
					creditCardTransactionId: id,
				})),
			)
		}
	})
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
		eq(schema.creditCardStatement.creditCardId, creditCardId),
		lte(schema.creditCardStatement.closingDate, maxClosingDate),
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
						columns: { type: true },
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
			.select({ id: schema.creditCardStatement.id })
			.from(schema.creditCardStatement)
			.where(whereFilter),
	)

	return { statements, total }
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
			currencyCode: schema.currency.code,
			total: sum(schema.creditCardTransactionInstallment.amount),
			type: schema.creditCardTransaction.type,
		})
		.from(schema.creditCardTransactionInstallment)
		.innerJoin(
			schema.creditCardTransaction,
			eq(
				schema.creditCardTransactionInstallment.creditCardTransactionId,
				schema.creditCardTransaction.id,
			),
		)
		.innerJoin(
			schema.currency,
			eq(schema.creditCardTransaction.currencyId, schema.currency.id),
		)
		.where(
			eq(
				schema.creditCardTransactionInstallment.statementId,
				statementId,
			),
		)
		.groupBy(schema.currency.code, schema.creditCardTransaction.type)
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

// cc transactions

export async function makeTransactionInstallments({
	db,
	creditCardId,
	amount,
	transactionDate,
	installmentCount,
}: {
	db: DB
	creditCardId: string
	amount: number
	transactionDate: Date
	installmentCount: number
}) {
	await ensureStatementsExist({
		db,
		creditCardId,
		date: transactionDate,
	})

	const transactionStatement = await getStatementByDate({
		db,
		creditCardId,
		date: transactionDate,
	})
	if (!transactionStatement) {
		throw new Error('Could not find statement for date')
	}

	let lastInstallmentClosing = transactionStatement.closingDate
	for (let i = 1; i < installmentCount; i++) {
		lastInstallmentClosing = addMonth(lastInstallmentClosing)
	}
	await ensureStatementsExist({
		db,
		creditCardId,
		date: new Date(lastInstallmentClosing),
	})

	const statements = await getStatementsFromDate({
		db,
		creditCardId,
		date: transactionStatement.closingDate,
		limit: installmentCount,
	})
	if (statements.length < installmentCount) {
		throw new Error(
			`Expected ${installmentCount} statements but found ${statements.length}`,
		)
	}

	const baseAmount = Math.floor(amount / installmentCount)
	const remainder = amount - baseAmount * installmentCount

	const installments = statements.map((statement, i) => ({
		installmentNumber: i + 1,
		amount: baseAmount + (i < remainder ? 1 : 0),
		statementId: statement.id,
	}))

	return installments
}

export async function createCreditCardTransaction({
	db,
	creditCardId,
	transactionData,
	installments,
}: {
	db: DB
	creditCardId: string
	transactionData: {
		date: string
		type: TTransactionType
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
		const [{ id: creditCardTransactionId }] = await tx
			.insert(schema.creditCardTransaction)
			.values({
				...transactionData,
				creditCardId,
			})
			.returning({ id: schema.creditCardTransaction.id })

		await tx.insert(schema.creditCardTransactionInstallment).values(
			installments.map(i => ({
				...i,
				creditCardTransactionId,
			})),
		)
	})
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
		type: TTransactionType
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
			.update(schema.creditCardTransaction)
			.set(transactionData)
			.where(eq(schema.creditCardTransaction.id, creditCardTransactionId))

		await tx
			.delete(schema.creditCardTransactionInstallment)
			.where(
				eq(
					schema.creditCardTransactionInstallment
						.creditCardTransactionId,
					creditCardTransactionId,
				),
			)

		await tx.insert(schema.creditCardTransactionInstallment).values(
			installments.map(i => ({
				...i,
				creditCardTransactionId,
			})),
		)
	})
}

export async function deleteCreditCardTransaction({
	db,
	creditCardTransactionId,
}: {
	db: DB
	creditCardTransactionId: string
}) {
	await db
		.delete(schema.creditCardTransaction)
		.where(eq(schema.creditCardTransaction.id, creditCardTransactionId))
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

// cc transaction installments
export async function getTransactionInstallmentCount({
	db,
	transactionId,
}: {
	db: DB
	transactionId: string
}) {
	return db.$count(
		schema.creditCardTransactionInstallment,
		eq(
			schema.creditCardTransactionInstallment.creditCardTransactionId,
			transactionId,
		),
	)
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
				schema.creditCardTransactionInstallment.installmentNumber,
			amount: schema.creditCardTransactionInstallment.amount,
			date: schema.creditCardStatement.dueDate,
		})
		.from(schema.creditCardTransactionInstallment)
		.innerJoin(
			schema.creditCardStatement,
			eq(
				schema.creditCardTransactionInstallment.statementId,
				schema.creditCardStatement.id,
			),
		)
		.where(
			eq(
				schema.creditCardTransactionInstallment.creditCardTransactionId,
				transactionId,
			),
		)
		.orderBy(
			desc(schema.creditCardTransactionInstallment.installmentNumber),
		)
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
			id: schema.creditCardTransactionInstallment.id,
			installmentNumber:
				schema.creditCardTransactionInstallment.installmentNumber,
			amount: schema.creditCardTransactionInstallment.amount,
			transactionId: schema.creditCardTransaction.id,
			transactionDate: schema.creditCardTransaction.date,
			transactionType: schema.creditCardTransaction.type,
			transactionDescription: schema.creditCardTransaction.description,
			category: schema.creditCardTransaction.category,
			currencyCode: schema.currency.code,
			totalInstallments: db.$count(
				schema.creditCardTransactionInstallment,
				eq(
					schema.creditCardTransaction.id,
					schema.creditCardTransactionInstallment
						.creditCardTransactionId,
				),
			),
		})
		.from(schema.creditCardTransactionInstallment)
		.innerJoin(
			schema.creditCardTransaction,
			eq(
				schema.creditCardTransactionInstallment.creditCardTransactionId,
				schema.creditCardTransaction.id,
			),
		)
		.innerJoin(
			schema.currency,
			eq(schema.creditCardTransaction.currencyId, schema.currency.id),
		)
		.where(
			eq(
				schema.creditCardTransactionInstallment.statementId,
				statementId,
			),
		)
		.orderBy(
			desc(schema.creditCardTransaction.date),
			desc(schema.creditCardTransaction.createdAt),
		)

	const total = await db.$count(installmentsQuery)
	const installments = await installmentsQuery
		.limit(pageSize)
		.offset((page - 1) * pageSize)

	return { installments, total }
}
