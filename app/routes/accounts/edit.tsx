import { and, eq, ne } from 'drizzle-orm'
import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types/edit'

import { account as accountTable } from '~/database/schema'
import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import { ACTION_EDITION } from '~/lib/constants'

import { AccountForm } from './components/form'
import { createAccountFormSchema } from './lib/schemas'

export function meta({ loaderData }: Route.MetaArgs) {
	const title = loaderData?.initialData
		? loaderData.meta.title
		: loaderData?.meta.notFoundTitle
	return [
		{ title },
		{ property: 'og:title', content: title },
		{ name: 'description', content: loaderData?.meta.description ?? title },
	]
}

export async function loader({
	context,
	params: { accountId },
}: Route.LoaderArgs) {
	const db = context.get(dbContext)
	const user = context.get(userContext)
	const t = getServerT(context, 'accounts')

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
		throw new Response(t('form.edit.loader.notFoundError'), { status: 404 })
	}

	const { ownerId: _ownerId, ...accountData } = account
	return {
		initialData: accountData,
		meta: {
			title: t('form.edit.meta.title', { name: account.name }),
			notFoundTitle: t('form.edit.meta.notFoundTitle', { accountId }),
			description: t('form.edit.meta.description', { name: account.name }),
		},
	}
}

export async function action({ context, request }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'accounts')

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		async: true,
		schema: createAccountFormSchema(t).superRefine(async (data, ctx) => {
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
					message: t('form.edit.action.accountWithIdNotFoundError', {
						id: data.id,
					}),
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
					message: t('form.edit.action.duplicateError'),
				})
			}
		}),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_EDITION) {
		throw new Response(t('form.edit.action.invalidActionError'), { status: 422 })
	}

	const { action: _action, id, ...body } = submission.value

	await db.update(accountTable).set(body).where(eq(accountTable.id, id))

	return await redirectWithToast(`/app/accounts/${id}`, request, {
		type: 'success',
		title: t('form.edit.action.successToast'),
	})
}

export default function EditAccount({
	loaderData: { initialData },
	actionData,
}: Route.ComponentProps) {
	return (
		<AccountForm
			action={ACTION_EDITION}
			initialData={initialData}
			lastResult={actionData?.submission}
		/>
	)
}
