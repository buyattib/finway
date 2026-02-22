import { z } from 'zod'
import type { TFunction } from 'i18next'
import { ACCOUNT_TYPES, ACTION_CREATION, ACTION_EDITION } from '~/lib/constants'

const ActionSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal(ACTION_CREATION),
		redirectTo: z.string().default(''),
	}),
	z.object({
		action: z.literal(ACTION_EDITION),
		id: z.string(),
	}),
])

export function createAccountFormSchema(t: TFunction<'accounts', 'form'>) {
	return z
		.object({
			name: z
				.string(t('schema.nameRequired'))
				.transform(value => value.trim()),
			accountType: z.enum(ACCOUNT_TYPES, t('schema.accountTypeRequired')),
			description: z
				.string()
				.default('')
				.transform(value => value?.trim()),
		})
		.and(ActionSchema)
}

export type AccountFormSchema = ReturnType<typeof createAccountFormSchema>

export const DeleteAccountFormSchema = z.object({
	accountId: z.string(),
	intent: z.literal('delete'),
})
