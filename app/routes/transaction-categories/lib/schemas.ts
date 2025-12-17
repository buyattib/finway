import { z } from 'zod'

export const CreateTransactionCategoryFormSchema = z.object({
	name: z.string('Name is required').transform(value => value.trim()),
	description: z
		.string()
		.default('')
		.transform(value => value?.trim()),

	redirectTo: z.string().default(''),
})

export const DeleteTransactionCategoryFormSchema = z.object({
	transactionCategoryId: z.string(),
	intent: z.literal('delete'),
})
