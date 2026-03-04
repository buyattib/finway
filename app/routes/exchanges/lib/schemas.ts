import { z } from 'zod'
import type { TFunction } from 'i18next'

import { removeCommas } from '~/lib/utils'

export function createExchangeFormSchema(t: TFunction<'exchanges'>) {
	const BaseExchangeFormSchema = z.object({
		date: z.iso.datetime(t('form.schema.dateRequired')),
		fromAmount: z
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
		toAmount: z
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

		fromCurrencyId: z.string(t('form.schema.fromCurrencyRequired')),
		toCurrencyId: z.string(t('form.schema.toCurrencyRequired')),

		accountId: z.string(t('form.schema.accountRequired')),
	})

	return BaseExchangeFormSchema.extend({}).refine(
		data => {
			return data.fromCurrencyId !== data.toCurrencyId
		},
		{
			message: t('form.schema.sameCurrencyError'),
			path: ['toCurrencyId'],
		},
	)
}

export type CreateExchangeFormSchema = ReturnType<
	typeof createExchangeFormSchema
>

export const DeleteExchangeFormSchema = z.object({
	exchangeId: z.string(),
	intent: z.literal('delete'),
})
