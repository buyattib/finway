import type { MiddlewareFunction } from 'react-router'

import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { initializeDate } from '~/lib/utils'

import { creditCardContext } from './context'
import { getCreditCardById, getStatementByDate } from './queries'

export const creditCardMiddleware: MiddlewareFunction = async ({
	context,
	params,
}) => {
	const t = getServerT(context, 'credit-cards')
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const creditCardId = params.creditCardId
	if (!creditCardId) {
		throw new Response(t('details.loader.notFoundError'), { status: 404 })
	}

	const creditCard = await getCreditCardById({ db, creditCardId })
	if (!creditCard || creditCard.ownerId !== user.id) {
		throw new Response(t('details.loader.notFoundError'), { status: 404 })
	}

	const currentStatement = await getStatementByDate({
		db,
		creditCardId,
		date: initializeDate(),
	})

	if (!currentStatement) {
		throw new Error('There is a problem with your credit card statements')
	}

	const { ownerId: _ownerId, ...creditCardData } = creditCard

	context.set(creditCardContext, {
		creditCard: creditCardData,
		currentStatement: {
			id: currentStatement.id,
			closingDate: currentStatement.closingDate,
			dueDate: currentStatement.dueDate,
		},
	})
}
