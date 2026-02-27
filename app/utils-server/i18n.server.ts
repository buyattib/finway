import type { FlatNamespace, KeyPrefix, Namespace } from 'i18next'
import { data } from 'react-router'
import type { RouterContextProvider } from 'react-router'

import { getInstance, getLocale, localeCookie } from '~/middleware/i18next'
import { LocaleFormSchema } from '~/components/locale-toggle'

export async function localeAction(formData: FormData) {
	const submission = LocaleFormSchema.safeParse({
		locale: formData.get('locale'),
	})

	if (!submission.success) {
		return data({ status: 'error', submission: undefined }, { status: 400 })
	}

	return data(
		{ status: 'success', submission: undefined },
		{
			headers: {
				'Set-Cookie': await localeCookie.serialize(
					submission.data.locale,
				),
			},
		},
	)
}

export function getServerT<
	Ns extends Namespace,
	TKPrefix extends KeyPrefix<ActualNs> = undefined,
	ActualNs extends Namespace = Ns extends null ? never : Ns,
>(
	context: Readonly<RouterContextProvider>,
	ns: Ns & FlatNamespace,
	keyPrefix?: TKPrefix,
) {
	const locale = getLocale(context)
	return getInstance(context).getFixedT(locale, ns, keyPrefix)
}
