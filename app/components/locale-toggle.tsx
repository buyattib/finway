import { useFetcher, useFetchers } from 'react-router'
import { z } from 'zod'

import { Button } from '~/components/ui/button'
import { useRootLoader } from '~/hooks/use-root-loader'

import type { action } from '~/routes/app'

export const LocaleFormSchema = z.object({
	locale: z.enum(['en', 'es']),
})

export function LocaleToggle() {
	const currentLocale = useLocale()
	const fetcher = useFetcher<typeof action>()

	const nextLocale = (
		{
			en: 'es',
			es: 'en',
		} as const
	)[currentLocale]

	return (
		<fetcher.Form method='post' action='/'>
			<input type='hidden' name='locale' value={nextLocale} />
			<Button
				variant='ghost'
				size='icon'
				name='intent'
				value='locale-toggle'
			>
				<span className='text-sm font-semibold'>
					{nextLocale?.toUpperCase()}
				</span>
				<span className='sr-only'>Toggle language</span>
			</Button>
		</fetcher.Form>
	)
}

export function useLocale() {
	const rootLoader = useRootLoader()

	const fetchers = useFetchers()
	const fetcher = fetchers.find(
		f => f.formData?.get('intent') === 'locale-toggle',
	)
	const optimisticLocale = fetcher?.formData?.get('locale')
	const parsed = LocaleFormSchema.safeParse({ locale: optimisticLocale })

	if (!parsed.success) return rootLoader?.locale ?? 'en'

	return parsed.data.locale
}
