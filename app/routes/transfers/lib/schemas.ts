import { z } from 'zod'
import type { TFunction } from 'i18next'

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

export function createTransferFormSchema(t: TFunction<'transfers'>) {
	const BaseTransferFormSchema = z.object({
		date: z.iso.datetime(t('form.schema.dateRequired')),
		amount: z
			.string({ message: t('form.schema.amountRequired') })
			.refine(value => !isNaN(Number(value)), {
				message: t('form.schema.amountInvalid'),
			})
			.refine(value => Number(value) > 0, {
				message: t('form.schema.amountPositive'),
			}),
		currencyId: z.string(t('form.schema.currencyRequired')),

		fromAccountId: z.string(t('form.schema.fromAccountRequired')),
		toAccountId: z.string(t('form.schema.toAccountRequired')),
	})

	return BaseTransferFormSchema.extend({})
		.refine(
			data => {
				return data.fromAccountId !== data.toAccountId
			},
			{
				message: t('form.schema.sameAccountError'),
				path: ['toAccountId'],
			},
		)
		.and(ActionSchema)
}
