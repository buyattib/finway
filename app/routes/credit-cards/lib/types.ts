import type {
	STATEMENT_STATUS_PAID,
	STATEMENT_STATUS_PENDING,
} from './constants'
import type { reduceStatementTotals } from './utils'

export type TStatementStatus =
	| typeof STATEMENT_STATUS_PAID
	| typeof STATEMENT_STATUS_PENDING

export type TCreditCardContext = {
	creditCard: {
		id: string
		brand: string
		last4: string
		expiryMonth: string
		expiryYear: string
		institution: string
		accountId: string
	}
	currentStatement: {
		id: string
		closingDate: string
		dueDate: string
	}
}

export type TReducedStatementTotals = ReturnType<typeof reduceStatementTotals>
