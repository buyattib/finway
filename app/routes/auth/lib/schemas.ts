import { z } from 'zod'
import type { TFunction } from 'i18next'

export function createLoginFormSchema(t: TFunction<'auth'>) {
	return z.object({
		email: z
			.email({ message: t('login.schema.emailInvalid') })
			.min(3, { message: t('login.schema.emailTooShort') })
			.max(100, { message: t('login.schema.emailTooLong') })
			.transform(value => value.toLowerCase()),
		remember: z.boolean().optional(),
		redirectTo: z.string().optional(),
	})
}
