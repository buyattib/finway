import { z } from 'zod'
import type { TFunction } from 'i18next'

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

export function createTransactionFormSchema(t: TFunction<'transactions'>) {
	return z
		.object({
			date: z.iso.datetime(t('form.schema.dateRequired')),
			type: z.enum(TRANSACTION_TYPES, t('form.schema.transactionTypeRequired')),
			amount: z
				.string({ message: t('form.schema.amountRequired') })
				.refine(
					value => {
						const formatted = removeCommas(value)
						return !isNaN(Number(formatted))
					},
					{
						message: t('form.schema.amountInvalid'),
					},
				)
				.refine(
					value => {
						const formatted = removeCommas(value)
						return Number(formatted) > 0
					},
					{
						message: t('form.schema.amountPositive'),
					},
				),
			description: z
				.string()
				.default('')
				.transform(value => value?.trim()),

			accountId: z.string(t('form.schema.accountRequired')),
			currencyId: z.string(t('form.schema.currencyRequired')),
			transactionCategoryId: z.string(t('form.schema.categoryRequired')),
		})
		.and(ActionSchema)
}

export type TransactionFormSchema = ReturnType<typeof createTransactionFormSchema>

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
