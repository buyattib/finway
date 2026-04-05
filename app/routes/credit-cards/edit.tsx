import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types/edit'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { getSelectData } from '~/lib/queries'
import { ACTION_EDITION } from '~/lib/constants'

import { CreditCardForm } from './components/form'
import { createCreditCardFormSchema } from './lib/schemas'
import { getCreditCardById, updateCreditCard } from './lib/queries'

export function meta({ loaderData }: Route.MetaArgs) {
	if (!loaderData?.initialData) {
		const title = loaderData?.meta.notFoundTitle
		return [
			{ title },
			{ property: 'og:title', content: title },
			{ name: 'description', content: title },
		]
	}

	const title = loaderData?.meta.title
	return [
		{ title },
		{ property: 'og:title', content: title },
		{ name: 'description', content: title },
	]
}

export async function loader({
	context,
	params: { creditCardId },
}: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)
	const t = getServerT(context, 'credit-cards')

	const creditCard = await getCreditCardById({ db, creditCardId })
	if (!creditCard || creditCard.account.ownerId !== user.id) {
		throw new Response(t('form.edit.loader.notFoundError'), { status: 404 })
	}

	const { account: _account, statements, ...rest } = creditCard
	const initialData = {
		...rest,
		currentClosingDate: statements[0]?.closingDate ?? '',
		currentDueDate: statements[0]?.dueDate ?? '',
	}
	const selectData = await getSelectData(db, user.id)

	return {
		selectData,
		initialData,
		meta: {
			title: t('form.edit.meta.title', {
				brand: initialData.brand,
				last4: initialData.last4,
			}),
			notFoundTitle: t('form.edit.meta.notFoundTitle', {
				creditCardId,
			}),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
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

	const { action: _action, id, accountId: _accountId, ...body } = submission.value

	const creditCard = await getCreditCardById({ db, creditCardId: id! })
	if (!creditCard || creditCard.account.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					formErrors: [t('form.edit.action.creditCardNotFound')],
				}),
			},
			{ status: 422 },
		)
	}

	await updateCreditCard({ db, id: id!, body })

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
