import { z } from 'zod'
import { ACCOUNT_TYPES, CURRENCIES } from './constants'

export const AccountFormSchema = z.object({
	id: z.string().optional(),
	name: z.string('name-required-msg').transform(value => value.trim()),
	accountType: z.enum(ACCOUNT_TYPES, 'account-type-required-msg'),
	description: z
		.string()
		.optional()
		.transform(value => value?.trim()),
	subAccounts: z
		.array(
			z.object({
				id: z.string().optional(),
				currency: z.enum(CURRENCIES, 'currency-required-msg'),
				balance: z
					.string({ message: 'balance-required-msg' })
					.refine(value => !isNaN(Number(value)), {
						message: 'balance-numeric-msg',
					})
					.refine(value => Number(value) >= 0, {
						message: 'balance-non-negative-msg',
					}),
			}),
		)
		.min(1, 'supported-currency-required-msg')
		.refine(subAccounts => {
			const currencies = subAccounts.map(sa => sa.currency)
			return new Set(currencies).size === currencies.length
		}, 'duplicate-currency-msg'),
})
