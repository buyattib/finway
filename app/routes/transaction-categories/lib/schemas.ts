import { z } from 'zod'
import type { TFunction } from 'i18next'

export function createTransactionCategoryFormSchema(
	t: TFunction<'transaction-categories'>,
) {
	return z.object({
		name: z
			.string(t('form.schema.nameRequired'))
			.transform(value => value.trim()),
		description: z
			.string()
			.default('')
			.transform(value => value?.trim()),

		redirectTo: z.string().default(''),
	})
}

export type CreateTransactionCategoryFormSchema = ReturnType<
	typeof createTransactionCategoryFormSchema
>

export const DeleteTransactionCategoryFormSchema = z.object({
	transactionCategoryId: z.string(),
	intent: z.literal('delete'),
})

export const AddSuggestionsSchema = z.object({
	intent: z.literal('add-suggestions'),
	categoryNames: z.array(z.string().min(1)).min(1),
})
