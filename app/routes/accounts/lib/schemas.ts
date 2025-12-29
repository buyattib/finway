import { z } from 'zod'
import { ACCOUNT_TYPES, ACTION_CREATION, ACTION_EDITION } from './constants'

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

export const AccountFormSchema = z
	.object({
		name: z.string('Name is required').transform(value => value.trim()),
		accountType: z.enum(ACCOUNT_TYPES, 'Account type is required'),
		description: z
			.string()
			.default('')
			.transform(value => value?.trim()),
	})
	.and(ActionSchema)

export const DeleteAccountFormSchema = z.object({
	accountId: z.string(),
	intent: z.literal('delete'),
})
