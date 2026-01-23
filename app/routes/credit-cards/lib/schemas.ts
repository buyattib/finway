import { z } from 'zod'

export const CreditCardFormSchema = z.object({
	brand: z.string('Brand is required'),
	last4: z.string('Last 4 numbers are required'),
	expiryMonth: z.string('Expiry month is required').refine(
		value => {
			const month = Number(value)
			return !isNaN(month) && month >= 1 && month <= 12
		},
		{ message: 'Expiry month must be a valid number between 1 and 12' },
	),
	expiryYear: z.string('Expiry year is required').refine(
		value => {
			const now = new Date()
			const year = Number(value)
			return !isNaN(year) && year >= now.getFullYear()
		},
		{
			message: 'Expiry year must be a valid year in the future',
		},
	),

	accountId: z.string('Account is required'),
	currencyId: z.string('Currency is required'),
})
