import { z } from 'zod'
import type { TFunction } from 'i18next'

import { removeCommas } from '~/lib/utils'

export function createTransferFormSchema(t: TFunction<'transfers'>) {
	const BaseTransferFormSchema = z.object({
		date: z.iso.datetime(t('form.schema.dateRequired')),
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
		currencyId: z.string(t('form.schema.currencyRequired')),

		fromAccountId: z.string(t('form.schema.fromAccountRequired')),
		toAccountId: z.string(t('form.schema.toAccountRequired')),
	})

	return BaseTransferFormSchema.extend({}).refine(
		data => {
			return data.fromAccountId !== data.toAccountId
		},
		{
			message: t('form.schema.sameAccountError'),
			path: ['toAccountId'],
		},
	)
}

export type CreateTransferFormSchema = ReturnType<typeof createTransferFormSchema>

export const DeleteTransferFormSchema = z.object({
	transferId: z.string(),
	intent: z.literal('delete'),
})
