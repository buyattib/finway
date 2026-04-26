import type { Route } from './+types/edit'

import { getServerT } from '~/utils-server/i18n.server'

import { dbContext, userContext } from '~/lib/context'
import { ACTION_EDITION } from '~/lib/constants'

import { AccountFormDialog } from './components/account-form-dialog'
import { getAccountById } from './lib/queries'
import { accountAction } from './lib/services'

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
	return await accountAction({ request, context, action: ACTION_EDITION })
}

export default function EditAccount({
	loaderData: { initialData },
}: Route.ComponentProps) {
	return (
		<AccountFormDialog
			action={ACTION_EDITION}
			initialData={initialData}
		/>
	)
}
