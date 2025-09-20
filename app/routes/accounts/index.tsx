import { Link } from 'react-router'
import { eq } from 'drizzle-orm'

import type { Route } from './+types/account'

import * as schema from '~/database/schema'
import { dbContext, userContext } from '~/lib/context'

import { Button } from '~/components/ui/button'

export function meta() {
	return [
		{ title: 'Accounts | Finhub' },

		{
			property: 'og:title',
			content: 'Accounts | Finhub',
		},
		{
			name: 'description',
			content: 'Your accounts',
		},
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const _user = await db.query.user.findFirst({
		where: eq(schema.user.id, user.id),
		// with: {
		// 	accounts: true,
		// },
	})

	console.log(user)

	return {}
}

export async function action() {}

export default function Accounts() {
	return (
		<>
			<Button asChild variant='link'>
				<Link to='create'>Create</Link>
			</Button>
		</>
	)
}
