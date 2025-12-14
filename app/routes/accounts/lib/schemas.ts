import { z } from 'zod'
import { formatNumberWithoutCommas } from '~/lib/utils'
import { ACCOUNT_TYPES, CURRENCIES } from './constants'

export const AccountFormSchema = z.object({
	id: z.string().optional(),
	name: z.string('Name is required').transform(value => value.trim()),
	accountType: z.enum(ACCOUNT_TYPES, 'Account type is required'),
	description: z
		.string()
		.default('')
		.transform(value => value?.trim()),
	subAccounts: z
		.array(
			z.object({
				id: z.string().optional(),
				currency: z.enum(CURRENCIES, 'Currency is required'),
				balance: z
					.string({ message: 'Balance is required' })
					.refine(
						value => {
							const formatted = formatNumberWithoutCommas(value)
							return !isNaN(Number(formatted))
						},
						{
							message: 'Balance must be a valid number',
						},
					)
					.refine(
						value => {
							const formatted = formatNumberWithoutCommas(value)
							return Number(formatted) >= 0
						},
						{
							message: 'Balance cannot be negative',
						},
					),
			}),
		)
		.min(1, 'At least one supported currency is required')
		.refine(subAccounts => {
			const currencies = subAccounts.map(sa => sa.currency)
			return new Set(currencies).size === currencies.length
		}, 'An account cannot have duplicate currencies'),
})

export const DeleteFormSchema = z.object({
	accountId: z.string(),
	intent: z.literal('delete'),
})
