import type { FlatNamespace, KeyPrefix, Namespace } from 'i18next'
import type { RouterContextProvider } from 'react-router'

import { getInstance, getLocale } from '~/middleware/i18next'

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
