import { and, eq } from 'drizzle-orm'
import { parseWithZod } from '@conform-to/zod/v4'
import { data } from 'react-router'
import { safeRedirect } from 'remix-utils/safe-redirect'
import type { Route } from './+types/create'

import { account as accountTable } from '~/database/schema'
import { dbContext, userContext } from '~/lib/context'
import { redirectWithToast } from '~/utils-server/toast.server'

import { AccountForm } from './components/account-form'
import { AccountFormSchema } from './lib/schemas'
import { ACTION_CREATION } from './lib/constants'

export function meta() {
	return [
		{ title: 'Create an Account | Finhub' },

		{
			property: 'og:title',
			content: 'Create an Account | Finhub',
		},
		{
			name: 'description',
			content: 'Create an account to track your transactions',
		},
	]
}

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url)
	const redirectTo = url.searchParams.get('redirectTo') || ''
	return { redirectTo }
}

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		async: true,
		schema: AccountFormSchema.superRefine(async (data, ctx) => {
			const existingAccountsCount = await db.$count(
				accountTable,
				and(
					eq(accountTable.ownerId, user.id),
					eq(accountTable.name, data.name),
					eq(accountTable.accountType, data.accountType),
				),
			)
			if (existingAccountsCount > 0) {
				return ctx.addIssue({
					code: 'custom',
					message:
						'An account with this name and type already exists',
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

	const { action, redirectTo, ...accountData } = submission.value

	const [{ id: accountId }] = await db
		.insert(accountTable)
		.values({ ...accountData, ownerId: user.id })
		.returning({ id: accountTable.id })

	return await redirectWithToast(
		safeRedirect(redirectTo || `/app/accounts/${accountId}`),
		request,
		{
			type: 'success',
			title: 'Account created successfully',
		},
	)
}

export default function CreateAccount({
	actionData,
	loaderData: { redirectTo },
}: Route.ComponentProps) {
	return (
		<AccountForm
			action={ACTION_CREATION}
			lastResult={actionData?.submission}
			redirectTo={redirectTo}
		/>
	)
}
