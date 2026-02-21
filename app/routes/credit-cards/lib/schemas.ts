import { z } from 'zod'
import { ACTION_CREATION, ACTION_EDITION } from '~/lib/constants'

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
	intent: z.literal('delete'),
})
