import type { MiddlewareFunction } from 'react-router'

import { dbContext, userContext } from '~/lib/context'

import { creditCardContext } from './context'
import { getServerT } from '~/utils-server/i18n.server'

import { getCreditCardById, getStatementByDate } from './queries'

export const creditCardMiddleware: MiddlewareFunction = async ({
	context,
	params,
}) => {
	const db = context.get(dbContext)
	const user = context.get(userContext)
	const t = getServerT(context, 'credit-cards')
	const creditCardId = params.creditCardId as string

	const creditCard = await getCreditCardById({ db, creditCardId })
	if (!creditCard || creditCard.account.ownerId !== user.id) {
		throw new Response(t('details.loader.notFoundError'), { status: 404 })
	}

	const currentStatement = await getStatementByDate({
		db,
		creditCardId,
		date: new Date(),
	})

	if (!currentStatement) {
		throw new Error('There is a problem with your credit card statements')
	}

	const { account, ...creditCardData } = creditCard

	context.set(creditCardContext, {
		...creditCardData,
		closingDate: currentStatement.closingDate,
		dueDate: currentStatement.dueDate,
		accountName: account.name,
	})
}
