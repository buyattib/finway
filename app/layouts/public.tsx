import { Outlet } from 'react-router'

import { FinhubLink } from '~/components/finhub-link'
import { ThemeToggle } from '~/components/theme-toggle'

export default function PublicLayout() {
	return (
		<>
			<header className='flex items-center justify-between p-6 border-b-2 border-b-secondary'>
				<FinhubLink />
				<div className='flex items-center gap-4'>
					<ThemeToggle />
				</div>
			</header>
			<main className='flex-1 flex flex-col container mx-auto py-6 sm:px-0 px-4'>
				<Outlet />
			</main>
		</>
	)
}
