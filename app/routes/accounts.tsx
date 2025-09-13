import { data, Form } from 'react-router'

import type { Route } from './+types/dashboard'

import { Button } from '~/components/ui/button'
import { createToastHeaders } from '~/utils/toast.server'

export async function action({ request }: Route.ActionArgs) {
	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: 'Testing toasts from the accounts',
		description: 'Pretty cool aye?',
	})

	return data({}, { headers: toastHeaders })
}

export default function Accounts() {
	return (
		<>
			Accounts
			<Form method='post'>
				<Button type='submit'>Toast</Button>
			</Form>
		</>
	)
}
