import { data, type RouterContextProvider } from 'react-router'
import { parseWithZod } from '@conform-to/zod/v4'
import { safeRedirect } from 'remix-utils/safe-redirect'

import { getServerT } from '~/utils-server/i18n.server'
import { redirectWithToast } from '~/utils-server/toast.server'
import { dbContext, userContext } from '~/lib/context'
import type { TFormAction } from '~/lib/types'
import { ACTION_CREATION, ACTION_EDITION } from '~/lib/constants'

import { createAccountFormSchema } from './schemas'
import {
	createAccount,
	getAccountById,
	getDuplicateAccountCount,
	updateAccount,
} from './queries'

export async function accountAction({
	request,
	context,
	action,
}: {
	request: Request
	context: Readonly<RouterContextProvider>
	action: TFormAction
}) {
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

	if (submission.value.action !== action) {
		const msg = {
			[ACTION_CREATION]: t('form.create.action.invalidActionError'),
			[ACTION_EDITION]: t('form.edit.action.invalidActionError'),
		}[action]
		throw new Response(msg, { status: 422 })
	}

	if (submission.value.action === ACTION_EDITION) {
		const account = await getAccountById({
			db,
			accountId: submission.value.id,
		})
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
	}

	const excludeId =
		submission.value.action === ACTION_EDITION
			? submission.value.id
			: undefined

	const existingAccountsCount = await getDuplicateAccountCount({
		db,
		ownerId: user.id,
		name: submission.value.name,
		accountType: submission.value.accountType,
		excludeId,
	})
	if (existingAccountsCount > 0) {
		const msg = {
			[ACTION_CREATION]: t('form.create.action.duplicateError'),
			[ACTION_EDITION]: t('form.edit.action.duplicateError'),
		}[action]
		return data(
			{ submission: submission.reply({ formErrors: [msg] }) },
			{ status: 422 },
		)
	}

	if (submission.value.action === ACTION_CREATION) {
		const { action: _action, redirectTo, ...accountData } = submission.value

		const accountId = await createAccount({
			db,
			ownerId: user.id,
			...accountData,
		})

		return await redirectWithToast(
			safeRedirect(redirectTo || `/app/accounts/${accountId}`),
			request,
			{
				type: 'success',
				title: t('form.create.action.successToast'),
			},
		)
	}

	const { action: _action, id, ...body } = submission.value
	await updateAccount({ db, id, ...body })

	return await redirectWithToast(`/app/accounts/${id}`, request, {
		type: 'success',
		title: t('form.edit.action.successToast'),
	})
}
