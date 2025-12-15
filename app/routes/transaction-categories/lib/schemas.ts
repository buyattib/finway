import { z } from 'zod'

export const TransactionCategoryFormSchema = z.object({
	name: z.string('Name is required').transform(value => value.trim()),
	description: z
		.string()
		.default('')
		.transform(value => value?.trim()),
})

export const DeleteTransactionCategoryFormSchema = z.object({
	transactionCategoryId: z.string(),
	intent: z.literal('delete'),
})
