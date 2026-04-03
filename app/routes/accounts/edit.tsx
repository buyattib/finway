import { data } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'

import type { Route } from './+types/edit'

import { redirectWithToast } from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import { ACTION_EDITION } from '~/lib/constants'

import { AccountForm } from './components/form'
import {
	getAccountById,
	getDuplicateAccountCount,
	updateAccount,
} from './lib/queries'
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

	const account = await getAccountById({ db, accountId })
	if (!account || account.ownerId !== user.id) {
		throw new Response(t('form.edit.loader.notFoundError'), { status: 404 })
	}

	const { ownerId: _ownerId, ...accountData } = account
	return {
		initialData: accountData,
		meta: {
			title: t('form.edit.meta.title', { name: account.name }),
			notFoundTitle: t('form.edit.meta.notFoundTitle', { accountId }),
			description: t('form.edit.meta.description', {
				name: account.name,
			}),
		},
	}
}

export async function action({ context, request }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'accounts')

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: createAccountFormSchema(t),
	})

	if (submission.status !== 'success') {
		return data({ submission: submission.reply() }, { status: 422 })
	}

	if (submission.value.action !== ACTION_EDITION) {
		throw new Response(t('form.edit.action.invalidActionError'), {
			status: 422,
		})
	}

	const account = await getAccountById({ db, accountId: submission.value.id })
	if (!account || account.ownerId !== user.id) {
		return data(
			{
				submission: submission.reply({
					formErrors: [
						t('form.edit.action.accountWithIdNotFoundError', {
							id: submission.value.id,
						}),
					],
				}),
			},
			{ status: 422 },
		)
	}

	const existingAccountsCount = await getDuplicateAccountCount({
		db,
		ownerId: user.id,
		name: submission.value.name,
		accountType: submission.value.accountType,
		excludeId: submission.value.id,
	})
	if (existingAccountsCount > 0) {
		return data(
			{
				submission: submission.reply({
					formErrors: [t('form.edit.action.duplicateError')],
				}),
			},
			{ status: 422 },
		)
	}

	const { action: _action, id, ...body } = submission.value

	await updateAccount({ db, id, ...body })

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
