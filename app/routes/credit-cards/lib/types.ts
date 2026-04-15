import { CC_TRANSACTION_TYPES } from './constants'

export type TCCTransactionType = (typeof CC_TRANSACTION_TYPES)[number]

export type TCreditCardContext = {
	id: string
	brand: string
	last4: string
	expiryMonth: string
	expiryYear: string
	institution: string
	accountId: string
	closingDate: string
	dueDate: string
}
