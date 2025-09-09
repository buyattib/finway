import type { Route } from './+types/public'
import { data, Link, Outlet } from 'react-router'

import { ThemeToggle } from '~/components/theme-toggle'
import { FinhubIcon } from '~/components/ui/finhub-icon'

import { getTheme, useTheme } from '~/utils/theme'

export async function loader({ request }: Route.LoaderArgs) {
	const theme = await getTheme(request)
	return data({ theme })
}

export default function PublicLayout({ loaderData }: Route.ComponentProps) {
	const theme = useTheme(loaderData.theme)
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
