import type { Route } from './+types/create'

import { dbContext, userContext } from '~/lib/context'
import { ACTION_CREATION } from '~/lib/constants'

import { MOVEMENT_TABS } from './lib/constants'
import { getMovementFormData } from './lib/services'
import { MovementFormDialog } from './components/movement-form/dialog'

export async function loader({ context, params }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const movement = MOVEMENT_TABS.find(t => t === params.movement)
	if (!movement) {
		throw new Response('Not Found', { status: 404 })
	}

	const formData = await getMovementFormData({ db, ownerId: user.id })
	return { movement, formData }
}

export default function MovementCreate({
	loaderData: { movement, formData },
}: Route.ComponentProps) {
	return (
		<MovementFormDialog
			action={ACTION_CREATION}
			entity={movement}
			{...formData}
		/>
	)
}
