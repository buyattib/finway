import { data, Form, Link, Outlet, useNavigate } from 'react-router'

import type { Route } from './+types/accounts'

import { createToastHeaders } from '~/utils/toast.server'

import { Button } from '~/components/ui/button'
import { Dialog, DialogTrigger } from '~/components/ui/dialog'

export async function action({ request }: Route.ActionArgs) {
	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: 'Testing toasts from the accounts',
		description: 'Pretty cool aye?',
	})

	return data({}, { headers: toastHeaders })
}

export default function Accounts() {
	const navigate = useNavigate()

	return (
		<>
			Accounts
			<Form method='post'>
				<Button type='submit'>Toast</Button>
			</Form>
			<Dialog onOpenChange={value => !value && navigate(-1)}>
				<DialogTrigger asChild>
					<Button asChild variant='secondary' width='fit'>
						<Link to='123'>Open</Link>
					</Button>
				</DialogTrigger>
				<Outlet />
			</Dialog>
		</>
	)
}
