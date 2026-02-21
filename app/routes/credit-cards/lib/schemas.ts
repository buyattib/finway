import { z } from 'zod'
import { ACTION_CREATION, ACTION_EDITION, CC_TRANSACTION_TYPES } from '~/lib/constants'
import { removeCommas } from '~/lib/utils'

const ActionSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal(ACTION_CREATION),
	}),
	z.object({
		action: z.literal(ACTION_EDITION),
		id: z.string(),
	}),
])

export const CreditCardFormSchema = z
	.object({
		brand: z.string('Brand is required'),
		last4: z
			.string('Last 4 digits are required')
			.regex(/^\d{4}$/, 'Must be exactly 4 digits'),
		expiryMonth: z
			.string('Expiry month is required')
			.regex(/^\d{1,2}$/, 'Must be a valid month')
			.refine(
				value => {
					const month = Number(value)
					return month >= 1 && month <= 12
				},
				{ message: 'Must be between 1 and 12' },
			),
		expiryYear: z
			.string('Expiry year is required')
			.regex(/^\d{4}$/, 'Must be a 4-digit year')
			.refine(
				value => {
					const year = Number(value)
					return year >= new Date().getFullYear()
				},
				{ message: 'Must be a valid year in the future' },
			),

		accountId: z.string('Account is required'),
		currencyId: z.string('Currency is required'),
	})
	.and(ActionSchema)

export const DeleteCreditCardFormSchema = z.object({
	creditCardId: z.string(),
	intent: z.literal('delete-card'),
})

export const CreditCardTransactionFormSchema = z
	.object({
		date: z.iso.datetime('Date is required'),
		type: z.enum(CC_TRANSACTION_TYPES, 'Transaction type is required'),
		amount: z
			.string({ message: 'Amount is required' })
			.refine(
				value => {
					const formatted = removeCommas(value)
					return !isNaN(Number(formatted))
				},
				{ message: 'Amount must be a valid number' },
			)
			.refine(
				value => {
					const formatted = removeCommas(value)
					return Number(formatted) > 0
				},
				{ message: 'Amount must be greater than zero' },
			),
		totalInstallments: z
			.string()
			.refine(
				value => !isNaN(Number(value)) && Number(value) >= 1,
				{ message: 'Must be at least 1' },
			),
		firstInstallmentDate: z.iso.datetime(),
		description: z
			.string()
			.default('')
			.transform(value => value?.trim()),
		transactionCategoryId: z.string('Category is required'),
		creditCardId: z.string('Credit card is required'),
	})
	.and(ActionSchema)

export const DeleteCreditCardTransactionFormSchema = z.object({
	creditCardTransactionId: z.string(),
	intent: z.literal('delete-transaction'),
})
