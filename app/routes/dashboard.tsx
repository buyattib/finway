import { data, Form } from 'react-router'

import type { Route } from './+types/dashboard'

import { Button } from '~/components/ui/button'
import { createToastHeaders } from '~/utils/toast.server'

export async function action({ request }: Route.ActionArgs) {
	const cookie = request.headers.get('Cookie')
	const toastHeaders = await createToastHeaders(cookie, {
		type: 'success',
		title: 'Testing toasts from the dashboard',
		description: 'Pretty cool aye?',
	})

	return data({}, { headers: toastHeaders })
}

export default function Dashboard() {
	return (
		<>
			Dashboard
			<Form method='post'>
				<Button type='submit'>Toast</Button>
			</Form>
		</>
	)
}
