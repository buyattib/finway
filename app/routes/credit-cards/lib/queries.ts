import {
	and,
	asc,
	desc,
	eq,
	gt,
	lt,
	lte,
	sql,
	sum,
	ne,
	inArray,
	count,
} from 'drizzle-orm'
import { unionAll } from 'drizzle-orm/sqlite-core'

import * as schema from '~/database/schema'
import type { DB } from '~/lib/types'
import { addMonth, initializeDate, subtractMonth } from '~/lib/utils'

import {
	TRANSACTION_TYPE_EXPENSE,
	TRANSACTION_TYPE_INCOME,
} from '~/features/transactions/constants'
import type { TCategory, TTransactionType } from '~/features/transactions/types'
import { ACCOUNT_TYPE_CREDIT_CARD } from '~/routes/accounts/lib/constants'

import { STATEMENT_STATUS_PAID, STATEMENT_STATUS_PENDING } from './constants'
import type { TReducedStatementTotals, TStatementStatus } from './types'

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
	await db.transaction(async tx => {
		const cc = await tx.query.creditCard.findFirst({
			where: (c, { eq }) => eq(c.id, id),
			columns: { accountId: true },
		})
		if (!cc) throw new Error('Credit card not found')

		// Deleting the account cascades to the credit card, its statements,
		// its transactions, and all installments.
		await tx
			.delete(schema.account)
			.where(eq(schema.account.id, cc.accountId))
	})
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

		const txInstallmentCount = tx
			.select({
				id: schema.transaction.id,
				installmentCount: count(
					schema.creditCardTransactionInstallment.id,
				).as('installmentCount'),
			})
			.from(schema.transaction)
			.innerJoin(
				schema.creditCardTransactionInstallment,
				eq(
					schema.creditCardTransactionInstallment.transactionId,
					schema.transaction.id,
				),
			)
			.groupBy(schema.transaction.id)
			.as('txInstallmentCount')

		const statementIds = [statementId]
		if (nextStatementId) statementIds.push(nextStatementId)

		// Get all transactions that have an installment in the statement
		const statementsTransactions = await tx
			.selectDistinct({
				id: schema.transaction.id,
				date: schema.transaction.date,
				amount: schema.transaction.amount,
				installmentCount: txInstallmentCount.installmentCount,
			})
			.from(schema.creditCardTransactionInstallment)
			.innerJoin(
				schema.transaction,
				eq(
					schema.creditCardTransactionInstallment.transactionId,
					schema.transaction.id,
				),
			)
			.innerJoin(
				txInstallmentCount,
				eq(txInstallmentCount.id, schema.transaction.id),
			)
			.where(
				inArray(
					schema.creditCardTransactionInstallment.statementId,
					statementIds,
				),
			)

		if (!statementsTransactions.length) return

		// Delete all installments from transactions which have an installment in the statement
		await tx.delete(schema.creditCardTransactionInstallment).where(
			inArray(
				schema.creditCardTransactionInstallment.transactionId,
				statementsTransactions.map(t => t.id),
			),
		)

		// Recreate the installments for each transaction
		for (const {
			id,
			amount,
			date,
			installmentCount,
		} of statementsTransactions) {
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
					transactionId: id,
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
					transaction: {
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

export async function getCreditCardStatementStatuses({
	db,
	creditCardId,
}: {
	db: DB
	creditCardId: string
}): Promise<Record<string, TStatementStatus>> {
	const owed = db
		.select({
			statementId: sql<string>`${schema.creditCardStatement.id}`.as(
				'statementId',
			),
			currencyId: sql<string>`${schema.transaction.currencyId}`.as(
				'currencyId',
			),
			amount: sql<number>`SUM(
				CASE
					WHEN ${schema.transaction.type} = ${TRANSACTION_TYPE_EXPENSE} THEN ${schema.creditCardTransactionInstallment.amount}
					WHEN ${schema.transaction.type} = ${TRANSACTION_TYPE_INCOME} THEN -${schema.creditCardTransactionInstallment.amount}
					ELSE 0
				END
			)`.as('amount'),
		})
		.from(schema.creditCardTransactionInstallment)
		.innerJoin(
			schema.creditCardStatement,
			and(
				eq(
					schema.creditCardStatement.id,
					schema.creditCardTransactionInstallment.statementId,
				),
				eq(schema.creditCardStatement.creditCardId, creditCardId),
			),
		)
		.innerJoin(
			schema.transaction,
			eq(
				schema.creditCardTransactionInstallment.transactionId,
				schema.transaction.id,
			),
		)
		.groupBy(
			schema.creditCardTransactionInstallment.statementId,
			schema.transaction.currencyId,
		)

	const paid = db
		.select({
			statementId: sql<string>`${schema.creditCardStatement.id}`.as(
				'statementId',
			),
			currencyId: sql<string>`${schema.transfer.currencyId}`.as(
				'currencyId',
			),
			amount: sql<number>`-SUM(${schema.transfer.amount})`.as('amount'),
		})
		.from(schema.creditCardStatementPayment)
		.innerJoin(
			schema.creditCardStatement,
			and(
				eq(
					schema.creditCardStatement.id,
					schema.creditCardStatementPayment.statementId,
				),
				eq(schema.creditCardStatement.creditCardId, creditCardId),
			),
		)
		.innerJoin(
			schema.transfer,
			eq(
				schema.transfer.id,
				schema.creditCardStatementPayment.transferId,
			),
		)
		.groupBy(
			schema.creditCardStatementPayment.statementId,
			schema.transfer.currencyId,
		)

	const combined = unionAll(owed, paid).as('combined')

	const perCurrency = db
		.select({
			statementId: sql<string>`${combined.statementId}`.as('statementId'),
			currencyId: sql<string>`${combined.currencyId}`.as('currencyId'),
			balance: sql<number>`SUM(${combined.amount})`.as('balance'),
		})
		.from(combined)
		.groupBy(sql`${combined.statementId}`, sql`${combined.currencyId}`)
		.as('perCurrency')

	const statements = await db
		.select({
			statementId: sql<string>`${perCurrency.statementId}`.as(
				'statementId',
			),
			status: sql<TStatementStatus>`
	            CASE WHEN SUM(ABS(${perCurrency.balance})) = 0
	                THEN ${STATEMENT_STATUS_PAID}
	                ELSE ${STATEMENT_STATUS_PENDING}
	            END
	        `.as('status'),
		})
		.from(perCurrency)
		.groupBy(sql`${perCurrency.statementId}`)

	return Object.fromEntries(statements.map(s => [s.statementId, s.status]))
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
			currencyId: schema.currency.id,
			currencyCode: schema.currency.code,
			total: sum(schema.creditCardTransactionInstallment.amount),
			type: schema.transaction.type,
		})
		.from(schema.creditCardTransactionInstallment)
		.innerJoin(
			schema.transaction,
			eq(
				schema.creditCardTransactionInstallment.transactionId,
				schema.transaction.id,
			),
		)
		.innerJoin(
			schema.currency,
			eq(schema.transaction.currencyId, schema.currency.id),
		)
		.where(
			eq(
				schema.creditCardTransactionInstallment.statementId,
				statementId,
			),
		)
		.groupBy(
			schema.currency.id,
			schema.currency.code,
			schema.transaction.type,
		)
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

// statement payments

export async function getStatementTotalPaymentByCurrency({
	db,
	statementId,
}: {
	db: DB
	statementId: string
}) {
	return db
		.select({
			currencyId: schema.transfer.currencyId,
			amount: sum(schema.transfer.amount),
		})
		.from(schema.creditCardStatementPayment)
		.innerJoin(
			schema.creditCardStatement,
			eq(
				schema.creditCardStatement.id,
				schema.creditCardStatementPayment.statementId,
			),
		)
		.innerJoin(
			schema.transfer,
			eq(
				schema.transfer.id,
				schema.creditCardStatementPayment.transferId,
			),
		)
		.where(eq(schema.creditCardStatementPayment.statementId, statementId))
		.groupBy(schema.transfer.currencyId)
}

export async function getStatementStatus({
	db,
	statementId,
	owed: owedTotals,
}: {
	db: DB
	statementId: string
	owed: TReducedStatementTotals
}): Promise<TStatementStatus> {
	const statementTotalPaymentByCurrency =
		await getStatementTotalPaymentByCurrency({ db, statementId })

	const paymentsByCurrency = new Map<string, number>()
	for (const st of statementTotalPaymentByCurrency) {
		const amount = Number(st.amount ?? 0)
		paymentsByCurrency.set(st.currencyId, amount)
	}

	for (const owed of owedTotals) {
		const payment = paymentsByCurrency.get(owed.currencyId)
		if (!payment || payment !== owed.amountCents)
			return STATEMENT_STATUS_PENDING
	}

	return STATEMENT_STATUS_PAID
}

export async function payStatement({
	db,
	statementId,
	date,
	fromAccountId,
	toAccountId,
	payments,
}: {
	db: DB
	statementId: string
	date: string
	fromAccountId: string
	toAccountId: string
	payments: { amount: number; currencyId: string }[]
}) {
	await db.transaction(async tx => {
		const transfers = await tx
			.insert(schema.transfer)
			.values(
				payments.map(({ amount, currencyId }) => ({
					date,
					amount,
					currencyId,
					fromAccountId,
					toAccountId,
				})),
			)
			.returning({ id: schema.transfer.id })

		await tx
			.insert(schema.creditCardStatementPayment)
			.values(
				transfers.map(({ id }) => ({ statementId, transferId: id })),
			)
	})
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

	const installments = statements.map((statement, i) => ({
		installmentNumber: i + 1,
		amount: baseAmount,
		statementId: statement.id,
	}))

	return installments
}

export async function createCreditCardTransaction({
	db,
	accountId,
	transactionData,
	installments,
}: {
	db: DB
	accountId: string
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
		const [{ id: transactionId }] = await tx
			.insert(schema.transaction)
			.values({
				...transactionData,
				accountId,
			})
			.returning({ id: schema.transaction.id })

		await tx.insert(schema.creditCardTransactionInstallment).values(
			installments.map(i => ({
				...i,
				transactionId,
			})),
		)
	})
}

export async function updateCreditCardTransaction({
	db,
	transactionId,
	transactionData,
	installments,
}: {
	db: DB
	transactionId: string
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
			.update(schema.transaction)
			.set(transactionData)
			.where(eq(schema.transaction.id, transactionId))

		await tx
			.delete(schema.creditCardTransactionInstallment)
			.where(
				eq(
					schema.creditCardTransactionInstallment.transactionId,
					transactionId,
				),
			)

		await tx.insert(schema.creditCardTransactionInstallment).values(
			installments.map(i => ({
				...i,
				transactionId,
			})),
		)
	})
}

export async function deleteCreditCardTransaction({
	db,
	transactionId,
}: {
	db: DB
	transactionId: string
}) {
	await db
		.delete(schema.transaction)
		.where(eq(schema.transaction.id, transactionId))
}

export async function getCreditCardTransactionById({
	db,
	transactionId,
}: {
	db: DB
	transactionId: string
}) {
	return db.query.transaction.findFirst({
		where: (tx, { eq }) => eq(tx.id, transactionId),
		columns: {
			id: true,
			date: true,
			type: true,
			amount: true,
			description: true,
			currencyId: true,
			category: true,
			accountId: true,
		},
		with: {
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
			schema.creditCardTransactionInstallment.transactionId,
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
				schema.creditCardTransactionInstallment.transactionId,
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
			transactionId: schema.transaction.id,
			transactionDate: schema.transaction.date,
			transactionType: schema.transaction.type,
			transactionDescription: schema.transaction.description,
			category: schema.transaction.category,
			currencyCode: schema.currency.code,
			totalInstallments: db.$count(
				schema.creditCardTransactionInstallment,
				eq(
					schema.transaction.id,
					schema.creditCardTransactionInstallment.transactionId,
				),
			),
		})
		.from(schema.creditCardTransactionInstallment)
		.innerJoin(
			schema.transaction,
			eq(
				schema.creditCardTransactionInstallment.transactionId,
				schema.transaction.id,
			),
		)
		.innerJoin(
			schema.currency,
			eq(schema.transaction.currencyId, schema.currency.id),
		)
		.where(
			eq(
				schema.creditCardTransactionInstallment.statementId,
				statementId,
			),
		)
		.orderBy(
			desc(schema.transaction.date),
			desc(schema.transaction.createdAt),
		)

	const total = await db.$count(installmentsQuery)
	const installments = await installmentsQuery
		.limit(pageSize)
		.offset((page - 1) * pageSize)

	return { installments, total }
}
