import { and, eq, ne } from 'drizzle-orm'
import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types/edit'

import { account as accountTable } from '~/database/schema'
import { dbContext, userContext } from '~/lib/context'
import { redirectWithToast } from '~/utils-server/toast.server'

import { GeneralErrorBoundary } from '~/components/general-error-boundary'

import { AccountForm } from './components/account-form'
import { AccountFormSchema } from './lib/schemas'
import { ACTION_EDITION } from './lib/constants'

export async function loader({
	context,
	params: { accountId },
}: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)

	const account = await db.query.account.findFirst({
		where: (account, { eq }) => eq(account.id, accountId),
		columns: {
			id: true,
			name: true,
			description: true,
			accountType: true,
			ownerId: true,
		},
	})
	if (!account || account.ownerId !== user.id) {
		throw new Response('Account not found', { status: 404 })
	}

	const { ownerId, ...accountData } = account
	return { account: accountData }
}

export async function action({ context, request }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		async: true,
		schema: AccountFormSchema.superRefine(async (data, ctx) => {
			if (data.action !== ACTION_EDITION) return

			const account = await db.query.account.findFirst({
				where: (account, { eq }) => eq(account.id, data.id),
				columns: {
					id: true,
					name: true,
					description: true,
					accountType: true,
					ownerId: true,
				},
			})
			if (!account || account.ownerId !== user.id) {
				return ctx.addIssue({
					code: 'custom',
					message: `Account with id ${data.id} not found`,
				})
			}

			const existingAccountsCount = await db.$count(
				accountTable,
				and(
					eq(accountTable.ownerId, user.id),
					eq(accountTable.name, data.name),
					eq(accountTable.accountType, data.accountType),
					ne(accountTable.id, data.id),
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

	if (submission.value.action !== ACTION_EDITION) {
		throw new Response('Invalid action', { status: 422 })
	}

	const { action, id, ...body } = submission.value

	await db.update(accountTable).set(body).where(eq(accountTable.id, id))

	return await redirectWithToast(`/app/accounts/${id}`, request, {
		type: 'success',
		title: 'Account updated successfully',
	})
}

export default function EditAccount({
	loaderData: { account },
	actionData,
}: Route.ComponentProps) {
	return (
		<AccountForm
			action={ACTION_EDITION}
			account={account}
			lastResult={actionData?.submission}
		/>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>
						Account with id <b>{params.accountId}</b> not found.
					</p>
				),
			}}
		/>
	)
}
