/**
 * Computes the first installment due date based on the credit card's billing cycle.
 *
 * - If transaction day <= closingDay: charge is on the current statement
 * - If transaction day > closingDay: charge rolls to the next statement
 *
 * The due date is on `dueDay` of the month after the statement closes.
 * When dueDay > closingDay, the due date falls in the same month as closing.
 * When dueDay <= closingDay, the due date falls in the following month.
 */
export function getFirstInstallmentDate(
	transactionDate: Date,
	closingDay: number,
	dueDay: number,
): Date {
	const year = transactionDate.getFullYear()
	const month = transactionDate.getMonth()
	const day = transactionDate.getDate()

	// Determine which statement this charge lands on
	const statementMonth = day <= closingDay ? month : month + 1

	// Due date is after the statement closes
	// If dueDay > closingDay, it's the same month as closing
	// If dueDay <= closingDay, it's the month after closing
	const dueMonth =
		dueDay > closingDay ? statementMonth : statementMonth + 1

	return new Date(year, dueMonth, dueDay)
}
