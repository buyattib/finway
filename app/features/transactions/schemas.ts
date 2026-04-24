import { z } from 'zod'
import type { TFunction } from 'i18next'

import { ACTION_CREATION, ACTION_EDITION } from '~/lib/constants'
import {
	ALL_TRANSACTION_CATEGORIES,
	TRANSACTION_CATEGORIES,
	TRANSACTION_TYPES,
} from './constants'

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
			date: z.iso
				.datetime(t('form.schema.dateRequired'))
				.refine(value => new Date(value) <= new Date(), {
					message: t('form.schema.dateFuture'),
				}),
			type: z.enum(
				TRANSACTION_TYPES,
				t('form.schema.transactionTypeRequired'),
			),
			amount: z
				.string({ message: t('form.schema.amountRequired') })
				.refine(value => !isNaN(Number(value)), {
					message: t('form.schema.amountInvalid'),
				})
				.refine(value => Number(value) > 0, {
					message: t('form.schema.amountPositive'),
				}),
			description: z
				.string()
				.default('')
				.transform(value => value?.trim()),

			accountId: z.string(t('form.schema.accountRequired')),
			currencyId: z.string(t('form.schema.currencyRequired')),
			category: z.enum(
				ALL_TRANSACTION_CATEGORIES,
				t('form.schema.categoryRequired'),
			),
		})
		.refine(
			data =>
				(
					TRANSACTION_CATEGORIES[data.type] as readonly string[]
				).includes(data.category),
			{
				message: t('form.schema.categoryInvalidForType'),
				path: ['category'],
			},
		)
		.and(ActionSchema)
}
