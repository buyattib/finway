import type { Route } from './+types/public'
import { Link, Outlet } from 'react-router'

import { ThemeToggle, useTheme } from '~/components/theme-toggle'
import { FinhubIcon } from '~/components/ui/finhub-icon'

export default function PublicLayout({ matches }: Route.ComponentProps) {
	const rootLoader = matches[0].loaderData
	const theme = useTheme(rootLoader.theme)

	return (
		<>
			<header className='flex items-center justify-between p-6 border-b-2 border-b-secondary gap-2'>
				<Link
					to='/'
					className='flex items-center gap-2 font-semibold text-primary text-lg'
				>
					<FinhubIcon />
					Finhub
				</Link>
				<ThemeToggle currentTheme={theme} />
			</header>
			<main className='flex-1 flex flex-col container mx-auto py-6 sm:px-0 px-4'>
				<Outlet />
			</main>
		</>
	)
}
