import { data } from 'react-router'

import type { Route } from './+types/account'

import {
	createToastHeaders,
	redirectWithToast,
} from '~/utils-server/toast.server'
import { getServerT } from '~/utils-server/i18n.server'
import { dbContext, userContext } from '~/lib/context'

import { deleteAccount, getAccountById } from './lib/queries'

export async function action({ request, context }: Route.ActionArgs) {
	const user = context.get(userContext)
	const db = context.get(dbContext)
	const t = getServerT(context, 'accounts')

	const formData = await request.formData()
	const accountId = formData.get('accountId')

	if (typeof accountId !== 'string' || !accountId) {
		const toastHeaders = await createToastHeaders(request, {
			type: 'error',
			title: t('delete.action.errorToast'),
			description: t('delete.action.errorToastDescription'),
		})
		return data({}, { headers: toastHeaders })
	}

	const account = await getAccountById({ db, accountId })
	if (!account || account.ownerId !== user.id) {
		throw new Response(t('delete.action.notFoundError'), { status: 404 })
	}

	await deleteAccount({ db, accountId })

	return await redirectWithToast('/app/accounts', request, {
		type: 'success',
		title: t('delete.action.successToast', { name: account.name }),
	})
}
