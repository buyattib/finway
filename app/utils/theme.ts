import { z } from 'zod'
import { createCookie, useFetchers } from 'react-router'

export const ThemeFormSchema = z.object({
	theme: z.enum(['light', 'dark']),
})

export type Theme = z.infer<typeof ThemeFormSchema>['theme']

export const themeCookie = createCookie('theme', {
	path: '/',
	sameSite: 'lax',
	httpOnly: true,
})

export async function getTheme(request: Request) {
	const cookieString = request.headers.get('Cookie')
	if (!cookieString) return 'light'

	const parsed = await themeCookie.parse(cookieString)

	const result = ThemeFormSchema.safeParse({ theme: parsed })
	if (!result.success) return 'light'

	return result.data.theme
}

export function useTheme(theme: Theme) {
	const fetchers = useFetchers()
	const fetcher = fetchers.find(
		f => f.formData?.get('intent') === 'theme-toggle',
	)

	const _theme = fetcher?.formData?.get('theme')

	const parsed = ThemeFormSchema.safeParse({ theme: _theme })

	if (!parsed.success) return theme

	return parsed.data.theme
}
