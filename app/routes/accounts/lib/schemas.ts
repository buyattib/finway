import { z } from 'zod'
import type { TFunction } from 'i18next'
import { ACTION_CREATION, ACTION_EDITION } from '~/lib/constants'
import { ASSETS_ACCOUNT_TYPES } from './constants'

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

export function createAccountFormSchema(t: TFunction<'accounts'>) {
	return z
		.object({
			name: z
				.string(t('form.schema.nameRequired'))
				.transform(value => value.trim()),
			accountType: z.enum(
				ASSETS_ACCOUNT_TYPES,
				t('form.schema.accountTypeRequired'),
			),
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
