import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types/edit'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { getSelectData } from '~/lib/queries'
import { ACTION_EDITION } from '~/lib/constants'

import { CreditCardForm } from './components/form'
import { createCreditCardFormSchema } from '../lib/schemas'
import { creditCardContext } from '../lib/context'
import { updateCreditCard } from '../lib/queries'

export function meta({ loaderData }: Route.MetaArgs) {
	const title = loaderData?.meta.title
	return [
		{ title },
		{ property: 'og:title', content: title },
		{ name: 'description', content: title },
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)
	const creditCard = context.get(creditCardContext)
	const t = getServerT(context, 'credit-cards')

	const selectData = await getSelectData(db, user.id)

	return {
		selectData,
		initialData: {
			id: creditCard.id,
			brand: creditCard.brand,
			last4: creditCard.last4,
			expiryMonth: creditCard.expiryMonth,
			expiryYear: creditCard.expiryYear,
			accountId: creditCard.accountId,
			currentClosingDate: creditCard.closingDate,
			currentDueDate: creditCard.dueDate,
		},
		meta: {
			title: t('form.edit.meta.title', {
				brand: creditCard.brand,
				last4: creditCard.last4,
			}),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const db = context.get(dbContext)
	const creditCard = context.get(creditCardContext)
	const t = getServerT(context, 'credit-cards')

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: createCreditCardFormSchema(t),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_EDITION) {
		throw new Response(t('form.edit.action.invalidActionError'), {
			status: 422,
		})
	}

	const {
		action: _action,
		id: _id,
		accountId: _accountId,
		...body
	} = submission.value

	await updateCreditCard({ db, id: creditCard.id, body })

	return await redirectWithToast('/app/credit-cards', request, {
		type: 'success',
		title: t('form.edit.action.successToast'),
	})
}

export default function EditCreditCard({
	loaderData: { selectData, initialData },
	actionData,
}: Route.ComponentProps) {
	return (
		<CreditCardForm
			action={ACTION_EDITION}
			selectData={selectData}
			initialData={initialData}
			lastResult={actionData?.submission}
		/>
	)
}
