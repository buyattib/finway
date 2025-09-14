import { Form } from 'react-router'
import { LogOutIcon } from 'lucide-react'

import { Button } from '~/components/ui/button'

export function LogoutButton() {
	return (
		<Form method='post' action='/logout'>
			<Button type='submit' size='icon' variant='link'>
				<LogOutIcon />
				<span className='sr-only'>Logout</span>
			</Button>
		</Form>
	)
}
