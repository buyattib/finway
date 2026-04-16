import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types/edit'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { ACTION_EDITION } from '~/lib/constants'

import { CreditCardForm } from './components/form'
import { creditCardFormSchema } from '../lib/schemas'
import { creditCardContext } from '../lib/context'
import { updateCreditCard, validateExistingCreditCard } from '../lib/queries'

export function meta({ loaderData }: Route.MetaArgs) {
	const title = loaderData?.meta.title
	return [
		{ title },
		{ property: 'og:title', content: title },
		{ name: 'description', content: title },
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const t = getServerT(context, 'credit-cards')
	const {
		creditCard: { accountId: _accountId, ...initialData },
	} = context.get(creditCardContext)

	return {
		initialData,
		meta: {
			title: t('form.edit.meta.title', {
				brand: initialData.brand,
				last4: initialData.last4,
			}),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const t = getServerT(context, 'credit-cards')
	const db = context.get(dbContext)
	const user = context.get(userContext)
	const { creditCard } = context.get(creditCardContext)

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: creditCardFormSchema(t),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_EDITION) {
		throw new Response(t('form.edit.action.invalidActionError'), {
			status: 422,
		})
	}

	const { action: _action, id: _id, ...creditCardData } = submission.value

	const existingCount = await validateExistingCreditCard({
		db,
		ownerId: user.id,
		brand: creditCardData.brand,
		last4: creditCardData.last4,
		institution: creditCardData.institution,
		excludeId: creditCard.id,
	})
	if (existingCount) {
		return data(
			{
				submission: submission.reply({
					formErrors: [t('form.edit.action.duplicateError')],
				}),
			},
			{ status: 422 },
		)
	}

	await updateCreditCard({
		db,
		id: creditCard.id,
		creditCardData,
	})

	return await redirectWithToast('/app/credit-cards', request, {
		type: 'success',
		title: t('form.edit.action.successToast'),
	})
}

export default function EditCreditCard({
	loaderData: { initialData },
	actionData,
}: Route.ComponentProps) {
	return (
		<CreditCardForm
			action={ACTION_EDITION}
			initialData={initialData}
			lastResult={actionData?.submission}
		/>
	)
}
