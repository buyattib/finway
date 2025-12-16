import { z } from 'zod'
import { removeCommas } from '~/lib/utils'
import { ACCOUNT_TYPES, CURRENCIES } from './constants'

const WalletFormSchema = z.object({
	currency: z.enum(CURRENCIES, 'Currency is required'),
	balance: z
		.string({ message: 'Balance is required' })
		.refine(
			value => {
				const formatted = removeCommas(value)
				return !isNaN(Number(formatted))
			},
			{
				message: 'Balance must be a valid number',
			},
		)
		.refine(
			value => {
				const formatted = removeCommas(value)
				return Number(formatted) >= 0
			},
			{
				message: 'Balance cannot be negative',
			},
		),
})

const BaseAccountFormSchema = z.object({
	name: z.string('Name is required').transform(value => value.trim()),
	accountType: z.enum(ACCOUNT_TYPES, 'Account type is required'),
	description: z
		.string()
		.default('')
		.transform(value => value?.trim()),
	wallets: z
		.array(WalletFormSchema.extend({ id: z.string().optional() }))
		.min(1, 'At least one supported currency is required')
		.refine(wallets => {
			const currencies = wallets.map(w => w.currency)
			return new Set(currencies).size === currencies.length
		}, 'An account cannot have duplicate currencies'),
})

export const CreateAccountFormSchema = BaseAccountFormSchema.extend({})
export const EditAccountFormSchema = BaseAccountFormSchema.extend({
	id: z.string(),
})

export const DeleteFormSchema = z.object({
	accountId: z.string(),
	intent: z.literal('delete'),
})
