import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types/edit'

import { createToastHeaders } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext } from '~/lib/context'

import { editStatementFormSchema } from '../lib/schemas'
import { creditCardContext } from '../lib/context'
import {
	getStatementById,
	getAdjacentStatements,
	updateStatement,
} from '../lib/queries'

export async function action({
	request,
	context,
	params: { statementId },
}: Route.ActionArgs) {
	const db = context.get(dbContext)
	const creditCard = context.get(creditCardContext)
	const t = getServerT(context, 'credit-cards')

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: editStatementFormSchema(t),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	const statement = await getStatementById({ db, statementId })
	if (!statement || statement.creditCardId !== creditCard.id) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: t('statement.details.action.notFoundError'),
		})
		return data(
			{ submission: submission.reply() },
			{ headers: toastHeaders },
		)
	}

	const { closingDate, dueDate } = submission.value

	const { previous, next } = await getAdjacentStatements({
		db,
		creditCardId: creditCard.id,
		closingDate: statement.closingDate,
	})

	const closingErrors: string[] = []
	if (previous && closingDate <= previous.closingDate) {
		closingErrors.push(
			t('statement.details.action.closingDateAfterPrevious'),
		)
	}
	if (next && closingDate >= next.closingDate) {
		closingErrors.push(t('statement.details.action.closingDateBeforeNext'))
	}

	if (closingErrors.length > 0) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: { closingDate: closingErrors },
				}),
			},
			{ status: 422 },
		)
	}

	await updateStatement({
		db,
		statementId,
		body: { closingDate, dueDate },
	})

	const toastHeaders = await createToastHeaders(request, {
		type: 'success',
		title: t('statement.details.action.editSuccessToast'),
	})
	return data({ submission: submission.reply() }, { headers: toastHeaders })
}
