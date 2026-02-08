import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'
import { eq } from 'drizzle-orm'

import type { Route } from './+types/edit'

import { dbContext, userContext } from '~/lib/context'
import { creditCard as creditCardTable } from '~/database/schema'
import { redirectWithToast } from '~/utils-server/toast.server'
import { getSelectData } from '~/lib/queries'

import { CreditCardForm } from './components/form'
import { CreditCardFormSchema } from './lib/schemas'
import { ACTION_EDITION } from '~/lib/constants'

export function meta({ loaderData, params: { creditCardId } }: Route.MetaArgs) {
	if (!loaderData?.initialData) {
		return [
			{
				title: `Credit card ${creditCardId} not found | Finway`,
			},
			{
				property: 'og:title',
				content: `Credit card ${creditCardId} not found | Finway`,
			},
			{
				name: 'description',
				content: `Credit card ${creditCardId} not found | Finway`,
			},
		]
	}

	const {
		initialData: { brand, last4 },
	} = loaderData

	return [
		{
			title: `Edit Credit Card ${brand} •••• ${last4} | Finway`,
		},
		{
			property: 'og:title',
			content: `Edit Credit Card ${brand} •••• ${last4} | Finway`,
		},
		{
			name: 'description',
			content: `Edit Credit Card ${brand} •••• ${last4} | Finway`,
		},
	]
}

export async function loader({
	context,
	params: { creditCardId },
}: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const creditCard = await db.query.creditCard.findFirst({
		where: (creditCard, { eq }) => eq(creditCard.id, creditCardId),
		columns: {
			id: true,
			brand: true,
			last4: true,
			expiryMonth: true,
			expiryYear: true,
			accountId: true,
			currencyId: true,
		},
		with: {
			account: {
				columns: { ownerId: true },
			},
		},
	})
	if (!creditCard || creditCard.account.ownerId !== user.id) {
		throw new Response('Credit card not found', { status: 404 })
	}

	const { account, ...initialData } = creditCard
	const selectData = await getSelectData(db, user.id)

	return { selectData, initialData }
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		async: true,
		schema: CreditCardFormSchema.superRefine(async (data, ctx) => {
			if (data.action !== ACTION_EDITION) return

			const creditCard = await db.query.creditCard.findFirst({
				where: (creditCard, { eq }) => eq(creditCard.id, data.id),
				with: {
					account: { columns: { ownerId: true } },
				},
			})
			if (!creditCard || creditCard.account.ownerId !== user.id) {
				return ctx.addIssue({
					code: 'custom',
					message: 'Credit card not found',
				})
			}
		}).transform(({ accountId, currencyId, ...rest }) => rest),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_EDITION) {
		throw new Response('Invalid action', { status: 422 })
	}

	const { action, id, ...body } = submission.value

	await db.update(creditCardTable).set(body).where(eq(creditCardTable.id, id))

	return await redirectWithToast('/app/credit-cards', request, {
		type: 'success',
		title: 'Credit card updated successfully',
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
