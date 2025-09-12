import { redirect } from 'react-router'
import type { Route } from './+types/logout'
import { removeAuthSession } from '~/utils/auth.server'

export async function loader() {
	redirect('/')
}

export async function action({ request }: Route.ActionArgs) {
	const cookie = request.headers.get('Cookie')
	return redirect('/login', { headers: await removeAuthSession(cookie) })
}
