import type { action } from '~/root'
import { useFetcher } from 'react-router'
import { getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { MoonIcon, SunIcon } from 'lucide-react'

import { Button } from '~/components/ui/button'

import { type Theme, ThemeFormSchema } from '~/utils/theme'

export function ThemeToggle({ currentTheme }: { currentTheme: Theme }) {
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
		<fetcher.Form method='post' {...getFormProps(form)}>
			<input type='hidden' name='theme' value={nextTheme} />
			<Button
				variant='ghost'
				size='icon'
				name='intent'
				value='theme-toggle'
			>
				<SunIcon className='h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
				<MoonIcon className='absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
				<span className='sr-only'>Theme toggle</span>
			</Button>
		</fetcher.Form>
	)
}
