import { CC_TRANSACTION_TYPES } from './constants'

export type TCCTransactionType = (typeof CC_TRANSACTION_TYPES)[number]

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
