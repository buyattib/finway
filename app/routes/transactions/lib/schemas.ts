import { z } from 'zod'

import { removeCommas } from '~/lib/utils'

import { TRANSACTION_TYPES } from './constants'

const BaseTransactionFormSchema = z.object({
	date: z.iso.datetime('Date is required'),
	type: z.enum(TRANSACTION_TYPES, 'Transaction type is required'),
	amount: z
		.string({ message: 'Amount is required' })
		.refine(
			value => {
				const formatted = removeCommas(value)
				return !isNaN(Number(formatted))
			},
			{
				message: 'Amount must be a valid number',
			},
		)
		.refine(
			value => {
				const formatted = removeCommas(value)
				return Number(formatted) >= 0
			},
			{
				message: 'Amount cannot be negative',
			},
		),
	description: z
		.string()
		.default('')
		.transform(value => value?.trim()),
	accountId: z.string('Account is required'),
	walletId: z.string('Currency is required'),
	transactionCategoryId: z.string('Category is required'),
})

export const CreateTransactionFormSchema = BaseTransactionFormSchema.extend({})
