import type { Route } from './+types/create'

import { getServerT } from '~/utils-server/i18n.server'

import { ACTION_CREATION } from '~/lib/constants'

import type { TAccountType } from './lib/types'
import { AccountFormDialog } from './components/account-form-dialog'
import { accountAction } from './lib/services'

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
	return await accountAction({ request, context, action: ACTION_CREATION })
}

export default function CreateAccount({
	loaderData: { initialData, redirectTo },
}: Route.ComponentProps) {
	return (
		<AccountFormDialog
			action={ACTION_CREATION}
			initialData={initialData}
			redirectTo={redirectTo}
		/>
	)
}
