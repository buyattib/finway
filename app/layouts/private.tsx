import { Outlet, redirect } from 'react-router'
import type { Route } from './+types/private'
import { getCurrentUser, removeAuthSession } from '~/utils/auth.server'

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
		<div className='flex flex-col'>
			<h1>Private layout</h1>
			<p>Hello {user.email}</p>
			<Outlet />
		</div>
	)
}
