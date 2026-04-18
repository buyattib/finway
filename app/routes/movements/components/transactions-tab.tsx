import type { Route } from '../+types'

import { MOVEMENT_TAB_TRANSACTIONS } from '../lib/constants'

type Props = Extract<
	Route.ComponentProps['loaderData'],
	{ tab: typeof MOVEMENT_TAB_TRANSACTIONS }
>['transactions']

export function TransactionsTab(_props: Props) {
	return <div>TODO: transactions table</div>
}
