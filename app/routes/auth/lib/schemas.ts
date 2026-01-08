import { z } from 'zod'

export const LoginFormSchema = z.object({
	email: z
		.email({ message: 'Email is invalid' })
		.min(3, { message: 'Email is too short' })
		.max(100, { message: 'Email is too long' })
		.transform(value => value.toLowerCase()),
	remember: z.boolean().optional(),
	redirectTo: z.string().optional(),
})
