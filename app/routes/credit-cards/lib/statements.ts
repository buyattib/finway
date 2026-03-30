import type { DB } from '~/lib/types'
import { creditCardStatement as creditCardStatementTable } from '~/database/schema'

function addMonth(dateStr: string): string {
	const date = new Date(dateStr)
	const targetDay = date.getUTCDate()
	date.setUTCMonth(date.getUTCMonth() + 1)
	// Handle overflow (e.g., Jan 31 -> Feb 28)
	if (date.getUTCDate() !== targetDay) {
		date.setUTCDate(0)
	}
	return date.toISOString()
}

export async function ensureStatementsExist(
	db: DB,
	creditCardId: string,
	targetDate: Date,
) {
	await db.transaction(async tx => {
		const latestStatement = await tx.query.creditCardStatement.findFirst({
			where: (s, { eq }) => eq(s.creditCardId, creditCardId),
			orderBy: (s, { desc }) => [desc(s.closingDate)],
		})

		if (!latestStatement) {
			throw new Error('No initial statement found for credit card')
		}

		const newStatements = []

		let lastClosing = latestStatement.closingDate
		let lastDue = latestStatement.dueDate
		while (new Date(lastClosing) < targetDate) {
			lastClosing = addMonth(lastClosing)
			lastDue = addMonth(lastDue)
			newStatements.push({
				closingDate: lastClosing,
				dueDate: lastDue,
				creditCardId,
			})
		}

		if (newStatements.length > 0) {
			await tx.insert(creditCardStatementTable).values(newStatements)
		}
	})
}

export async function getStatementForDate(
	db: DB,
	creditCardId: string,
	transactionDate: Date,
) {
	await ensureStatementsExist(db, creditCardId, transactionDate)

	const statement = await db.query.creditCardStatement.findFirst({
		where: (s, { eq, gte, and }) =>
			and(
				eq(s.creditCardId, creditCardId),
				gte(s.closingDate, transactionDate.toISOString()),
			),
		orderBy: (s, { asc }) => [asc(s.closingDate)],
	})

	if (!statement) {
		throw new Error('Could not find statement for date')
	}

	return statement
}
