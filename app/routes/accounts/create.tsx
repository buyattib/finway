import { and, eq } from 'drizzle-orm'
import { parseWithZod } from '@conform-to/zod/v4'
import { data } from 'react-router'
import { safeRedirect } from 'remix-utils/safe-redirect'
import type { Route } from './+types/create'

import { account as accountTable } from '~/database/schema'
import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import { ACTION_CREATION } from '~/lib/constants'
import type { TAccountType } from '~/lib/types'

import { createAccountFormSchema } from './lib/schemas'
import { AccountForm } from './components/form'

export function meta({ loaderData }: Route.MetaArgs) {
	return [
		{ title: loaderData?.meta.title },
		{ property: 'og:title', content: loaderData?.meta.title },
		{ name: 'description', content: loaderData?.meta.description },
	]
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const t = getServerT(context, 'accounts')
	const url = new URL(request.url)
	const redirectTo = url.searchParams.get('redirectTo') || ''
	return {
		redirectTo,
		initialData: {
			name: '',
			accountType: '' as TAccountType,
			description: '',
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
	const t = getServerT(context, 'accounts')

	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		async: true,
		schema: createAccountFormSchema(t).superRefine(async (data, ctx) => {
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
					message: t('form.create.action.duplicateError'),
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
			title: t('form.create.action.successToast'),
		},
	)
}

export default function CreateAccount({
	actionData,
	loaderData: { initialData, redirectTo },
}: Route.ComponentProps) {
	return (
		<AccountForm
			action={ACTION_CREATION}
			lastResult={actionData?.submission}
			initialData={initialData}
			redirectTo={redirectTo}
		/>
	)
}
