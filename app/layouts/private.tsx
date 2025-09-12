import { Form, Outlet, redirect } from 'react-router'
import type { Route } from './+types/private'
import { getCurrentUser, removeAuthSession } from '~/utils/auth.server'
import { LogOutIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'

export async function loader({ request }: Route.LoaderArgs) {
	const cookie = request.headers.get('Cookie')
	const user = await getCurrentUser(cookie)

	if (!user) {
		const authHeaders = await removeAuthSession(cookie)
		return redirect('/login', { headers: authHeaders })
	}

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
