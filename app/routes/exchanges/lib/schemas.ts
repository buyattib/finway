import { z } from 'zod'

import { removeCommas } from '~/lib/utils'

const BaseExchangeFormSchema = z.object({
	date: z.iso.datetime('Date is required'),
	fromAmount: z
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
	toAmount: z
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

	fromCurrencyId: z.string('From currency is required'),
	toCurrencyId: z.string('To currency is required'),

	accountId: z.string('Account is required'),
})

export const CreateExchangeFormSchema = BaseExchangeFormSchema.extend(
	{},
).refine(
	data => {
		return data.fromCurrencyId !== data.toCurrencyId
	},
	{
		message: 'An exchange can only be done between different currencies',
		path: ['toCurrencyId'],
	},
)

export const DeleteExchangeFormSchema = z.object({
	exchangeId: z.string(),
	intent: z.literal('delete'),
})
