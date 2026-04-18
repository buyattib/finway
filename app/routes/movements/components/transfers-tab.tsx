import type { Route } from '../+types'

import { MOVEMENT_TAB_TRANSFERS } from '../lib/constants'

type Props = Extract<
	Route.ComponentProps['loaderData'],
	{ tab: typeof MOVEMENT_TAB_TRANSFERS }
>['transfers']

export function TransfersTab(_props: Props) {
	return <div>TODO: transfers table</div>
}
