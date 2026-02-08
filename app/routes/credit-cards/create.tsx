import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'
import type { Route } from './+types/create'

import { dbContext, userContext } from '~/lib/context'
import { creditCard as creditCardTable } from '~/database/schema'
import { redirectWithToast } from '~/utils-server/toast.server'
import { getSelectData } from '~/routes/transactions/lib/queries'

import { CreditCardForm } from './components/form'
import { CreditCardFormSchema } from './lib/schemas'
import { ACTION_CREATION } from './lib/constants'

export function meta() {
	return [
		{ title: 'Create a credit card | Finway' },
		{
			property: 'og:title',
			content: 'Create a credit card | Finway',
		},
		{
			name: 'description',
			content: 'Create a credit card to track your expenses',
		},
	]
}

export async function loader({ context, request }: Route.LoaderArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

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

	const currencyId = selectData.currencies[0].id

	return {
		selectData,
		initialData: {
			last4: '',
			brand: '',
			expiryMonth: '',
			expiryYear: '',
			accountId,
			currencyId,
		},
	}
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		async: true,
		schema: CreditCardFormSchema.superRefine(async (data, ctx) => {
			const account = await db.query.account.findFirst({
				where: (account, { eq }) => eq(account.id, data.accountId),
				columns: { ownerId: true },
			})
			if (!account || account.ownerId !== user.id) {
				return ctx.addIssue({
					code: 'custom',
					message: 'Account not found',
					path: ['accountId'],
				})
			}

			const currency = await db.query.currency.findFirst({
				where: (currency, { eq }) => eq(currency.id, data.currencyId),
				columns: { id: true },
			})
			if (!currency) {
				return ctx.addIssue({
					code: 'custom',
					message: 'Currency not found',
					path: ['currencyId'],
				})
			}
		}),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_CREATION) {
		throw new Response('Invalid action', { status: 422 })
	}

	const { action, ...creditCardData } = submission.value

	await db.insert(creditCardTable).values(creditCardData)

	return await redirectWithToast('/app/credit-cards', request, {
		type: 'success',
		title: 'Credit card created successfully',
	})
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
