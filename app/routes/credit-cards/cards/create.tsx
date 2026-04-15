import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'
import type { Route } from './+types/create'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { ACTION_CREATION } from '~/lib/constants'

import { CreditCardForm } from './components/form'
import { creditCardFormSchema } from '../lib/schemas'
import { createCreditCard, validateExistingCreditCard } from '../lib/queries'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({ context }: Route.LoaderArgs) {
	const t = getServerT(context, 'credit-cards')

	return {
		initialData: {
			last4: '',
			brand: '',
			expiryMonth: '',
			expiryYear: '',
			institution: '',
		},
		meta: {
			title: t('form.create.meta.title'),
			description: t('form.create.meta.description'),
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'credit-cards')

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: creditCardFormSchema(t),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_CREATION) {
		throw new Response(t('form.create.action.invalidActionError'), {
			status: 422,
		})
	}

	const { action: _action, ...creditCardData } = submission.value

	const existingCount = await validateExistingCreditCard({
		db,
		ownerId: user.id,
		brand: creditCardData.brand,
		last4: creditCardData.last4,
		institution: creditCardData.institution,
	})
	if (existingCount) {
		return data(
			{
				submission: submission.reply({
					formErrors: [t('form.create.action.duplicateError')],
				}),
			},
			{ status: 422 },
		)
	}

	const creditCardId = await createCreditCard({
		db,
		ownerId: user.id,
		creditCardData,
	})

	return await redirectWithToast(
		`/app/credit-cards/${creditCardId}`,
		request,
		{
			type: 'success',
			title: t('form.create.action.successToast'),
		},
	)
}

export default function CreateCreditCard({
	loaderData: { initialData },
	actionData,
}: Route.ComponentProps) {
	return (
		<CreditCardForm
			action={ACTION_CREATION}
			initialData={initialData}
			lastResult={actionData?.submission}
		/>
	)
}
