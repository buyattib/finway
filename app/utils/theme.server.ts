import { createCookie, data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import { ThemeFormSchema } from '~/components/theme-toggle'

export const themeCookie = createCookie('finhub_theme', {
	path: '/',
	sameSite: 'lax',
	httpOnly: true,
})

export async function getTheme(request: Request) {
	const cookie = request.headers.get('Cookie')

	if (!cookie) return 'light'

	const parsed = await themeCookie.parse(cookie)
	const result = ThemeFormSchema.safeParse({ theme: parsed })
	if (!result.success) return 'light'

	return result.data.theme
}

export async function themeAction(formData: FormData) {
	const submission = await parseWithZod(formData, {
		schema: ThemeFormSchema,
		async: true,
	})

	if (submission.status !== 'success') {
		return data(
			{
				status: 'error',
				submission: submission.reply(),
			},
			{ status: 400 },
		)
	}

	return data(
		{
			status: 'success',
			submission: null,
		},
		{
			headers: {
				'Set-Cookie': await themeCookie.serialize(
					submission.value.theme,
				),
			},
		},
	)
}
