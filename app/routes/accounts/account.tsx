import { redirect } from 'react-router'

import type { Route } from './+types/account'

import { deleteAccountAction } from './lib/services'

export async function loader() {
	throw redirect('/app/accounts')
}

export async function action({ request, context }: Route.ActionArgs) {
	return await deleteAccountAction({ request, context })
}
