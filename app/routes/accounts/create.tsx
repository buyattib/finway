import type { Route } from './+types/create'

import { getServerT } from '~/utils-server/i18n.server'

import { ACTION_CREATION } from '~/lib/constants'

import type { TAccountType } from './lib/types'
import { AccountForm } from './components/form'
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
