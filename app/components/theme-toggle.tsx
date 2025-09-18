import { useFetcher, useFetchers } from 'react-router'
import { getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { MoonIcon, SunIcon } from 'lucide-react'
import { z } from 'zod'

import { Button } from '~/components/ui/button'
import { useRootLoader } from '~/hooks/use-root-loader'

import type { action } from '~/routes/index'

export const ThemeFormSchema = z.object({
	theme: z.enum(['light', 'dark']),
})

export type Theme = z.infer<typeof ThemeFormSchema>['theme']

export function ThemeToggle() {
	const currentTheme = useTheme()
	const fetcher = useFetcher<typeof action>()

	const [form] = useForm({
		id: 'theme-form',
		lastResult: fetcher.data?.submission,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ThemeFormSchema })
		},
	})

	const nextTheme =
		{
			dark: 'light',
			light: 'dark',
		}[currentTheme] ?? 'light'

	return (
		<fetcher.Form method='post' {...getFormProps(form)} action='/'>
			<input type='hidden' name='theme' value={nextTheme} />
			<Button
				variant='ghost'
				size='icon'
				name='intent'
				value='theme-toggle'
			>
				<SunIcon className='scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
				<MoonIcon className='absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
				<span className='sr-only'>Theme toggle</span>
			</Button>
		</fetcher.Form>
	)
}

export function useTheme() {
	const rootLoader = useRootLoader()

	const cookieTheme = rootLoader?.theme
	const hintTheme = rootLoader?.hints.theme

	const fetchers = useFetchers()
	const fetcher = fetchers.find(
		f => f.formData?.get('intent') === 'theme-toggle',
	)
	const _theme = fetcher?.formData?.get('theme')
	const parsed = ThemeFormSchema.safeParse({ theme: _theme })
	if (!parsed.success) return cookieTheme ?? hintTheme ?? 'light'

	return parsed.data.theme
}
