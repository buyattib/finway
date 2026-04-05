import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'
import type { Route } from './+types/create'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { getSelectData } from '~/lib/queries'
import { ACTION_CREATION } from '~/lib/constants'

import { CreditCardForm } from './components/form'
import { createCreditCardFormSchema } from './lib/schemas'
import { createCreditCard } from './lib/queries'
import { getAccountById } from '~/routes/accounts/lib/queries'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'credit-cards')

	const url = new URL(request.url)
	const accountIdParam = url.searchParams.get('accountId')

	const selectData = await getSelectData(db, user.id)

	let accountId = selectData.accounts?.[0]?.id || ''
	if (
		accountIdParam &&
		selectData.accounts.some(acc => acc.id === accountIdParam)
	) {
		accountId = accountIdParam
	}

	return {
		selectData,
		initialData: {
			last4: '',
			brand: '',
			expiryMonth: '',
			expiryYear: '',
			currentClosingDate: '',
			currentDueDate: '',
			accountId,
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
		schema: createCreditCardFormSchema(t),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_CREATION) {
		throw new Response(t('form.create.action.invalidActionError'), {
			status: 422,
		})
	}

	const {
		action: _action,
		currentClosingDate,
		currentDueDate,
		...creditCardData
	} = submission.value

	const account = await getAccountById({ db, accountId: creditCardData.accountId })
	if (!account || account.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					fieldErrors: {
						accountId: [t('form.create.action.accountNotFound')],
					},
				}),
			},
			{ status: 422 },
		)
	}

	const creditCardId = await createCreditCard({
		db,
		creditCardData,
		currentClosingDate: currentClosingDate!,
		currentDueDate: currentDueDate!,
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
	loaderData: { selectData, initialData },
	actionData,
}: Route.ComponentProps) {
	return (
		<CreditCardForm
			action={ACTION_CREATION}
			selectData={selectData}
			initialData={initialData}
			lastResult={actionData?.submission}
		/>
	)
}
