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
	const db = context.get(dbContext)
	const user = context.get(userContext)
	const t = getServerT(context, 'credit-cards')

	const creditCardId = params.creditCardId as string
	if (!creditCardId) {
		throw new Response(t('details.loader.notFoundError'), { status: 404 })
	}

	const creditCard = await getCreditCardById({ db, creditCardId })
	if (!creditCard || creditCard.account.ownerId !== user.id) {
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

	const { account: _account, ...creditCardData } = creditCard

	context.set(creditCardContext, {
		...creditCardData,
		statementId: currentStatement.id,
		closingDate: currentStatement.closingDate,
		dueDate: currentStatement.dueDate,
		creditCard: creditCardData,
		statement: {
			id: currentStatement.id,
			closingDate: currentStatement.closingDate,
			dueDate: currentStatement.dueDate,
		},
	})
}
