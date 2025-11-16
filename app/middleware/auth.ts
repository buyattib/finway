import type { MiddlewareFunction } from 'react-router'
import { dbContext, userContext } from '~/lib/context'
import { requireAuthenticated } from '~/utils-server/auth.server'

export const authMiddleware: MiddlewareFunction = async ({
	request,
	context,
}) => {
	const user = await requireAuthenticated(request, context.get(dbContext))
	context.set(userContext, user)
}
