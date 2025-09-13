import { Form, Outlet } from 'react-router'
import { LogOutIcon } from 'lucide-react'

import type { Route } from './+types/private'

import { requireAuthenticated } from '~/utils/auth.server'

import { Button } from '~/components/ui/button'

export async function loader({ request }: Route.LoaderArgs) {
	const user = await requireAuthenticated(request)

	// NOTE: could refresh the session here if user is authenticated and has an expiration date
	return { user }
}

export default function PrivateLayout({
	loaderData: { user },
}: Route.ComponentProps) {
	return (
		<>
			<header className='flex items-center justify-between p-4 border-b border-b-border'>
				<p>Hello {user.email}</p>
				<Form method='post' action='/logout'>
					<Button type='submit' variant='link'>
						<LogOutIcon />
					</Button>
				</Form>
			</header>
			<main className='flex-1 flex flex-col container mx-auto py-6 sm:px-0 px-4'>
				<Outlet />
			</main>
		</>
	)
}
