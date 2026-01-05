import { z } from 'zod'

import { removeCommas } from '~/lib/utils'

const BaseTransferFormSchema = z.object({
	date: z.iso.datetime('Date is required'),
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
	currencyId: z.string('Currency is required'),

	fromAccountId: z.string('From Account is required'),
	toAccountId: z.string('To Account is required'),
})

export const CreateTransferFormSchema = BaseTransferFormSchema.extend(
	{},
).refine(
	data => {
		return data.fromAccountId !== data.toAccountId
	},
	{
		message: 'A transfer can only be done between different accounts',
		path: ['toAccountId'],
	},
)

export const DeleteTransferFormSchema = z.object({
	transferId: z.string(),
	intent: z.literal('delete'),
})
