import { redirect } from 'react-router'
import type { Route } from './+types/logout'
import { removeAuthSession } from '~/utils/auth.server'

export async function loader() {
	return redirect('/')
}

export async function action({ request }: Route.ActionArgs) {
	return redirect('/login', { headers: await removeAuthSession(request) })
}
