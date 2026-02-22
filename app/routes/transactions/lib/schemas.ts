import { z } from 'zod'

import { removeCommas } from '~/lib/utils'

import {
	TRANSACTION_TYPES,
	ACTION_CREATION,
	ACTION_EDITION,
} from '~/lib/constants'

const ActionSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal(ACTION_CREATION),
	}),
	z.object({
		action: z.literal(ACTION_EDITION),
		id: z.string(),
	}),
])

export const TransactionFormSchema = z
	.object({
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
					return Number(formatted) > 0
				},
				{
					message: 'Amount must be greater than zero',
				},
			),
		description: z
			.string()
			.default('')
			.transform(value => value?.trim()),

		accountId: z.string('Account is required'),
		currencyId: z.string('Currency is required'),
		transactionCategoryId: z.string('Category is required'),
	})
	.and(ActionSchema)

export const DeleteTransactionFormSchema = z.object({
	transactionId: z.string(),
	intent: z.literal('delete'),
})

export const TransactionsFiltersSchema = z.object({
	accountId: z.string().optional(),
	currencyId: z.string().optional(),
	transactionCategoryId: z.string().optional(),
	transactionType: z.enum(TRANSACTION_TYPES).optional(),
})
