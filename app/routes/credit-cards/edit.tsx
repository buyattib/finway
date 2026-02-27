import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'
import { eq } from 'drizzle-orm'

import type { Route } from './+types/edit'

import { creditCard as creditCardTable } from '~/database/schema'
import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'
import { getSelectData } from '~/lib/queries'
import { ACTION_EDITION } from '~/lib/constants'

import { CreditCardForm } from './components/form'
import { createCreditCardFormSchema } from './lib/schemas'

export function meta({ loaderData, params: { creditCardId } }: Route.MetaArgs) {
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
		throw new Response(t('form.edit.loader.notFoundError'), { status: 404 })
	}

	const { account, ...initialData } = creditCard
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
	const submission = await parseWithZod(formData, {
		async: true,
		schema: createCreditCardFormSchema(t)
			.superRefine(async (data, ctx) => {
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
						message: t('form.edit.action.creditCardNotFound'),
					})
				}
			})
			.transform(({ accountId, currencyId, ...rest }) => rest),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_EDITION) {
		throw new Response(t('form.edit.action.invalidActionError'), { status: 422 })
	}

	const { action, id, ...body } = submission.value

	await db.update(creditCardTable).set(body).where(eq(creditCardTable.id, id))

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
