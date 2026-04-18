import type { Route } from '../+types'

import { MOVEMENT_TAB_EXCHANGES } from '../lib/constants'

type Props = Extract<
	Route.ComponentProps['loaderData'],
	{ tab: typeof MOVEMENT_TAB_EXCHANGES }
>['exchanges']

export function ExchangesTab(_props: Props) {
	return <div>TODO: exchanges table</div>
}
