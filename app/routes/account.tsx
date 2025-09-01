import type { Route } from './+types/account'
// import { database } from '~/database/context'

export async function loader({ params }: Route.LoaderArgs) {
	// const db = database()
	// query

	return { accountId: params.accountId }
}

export default function Account({ loaderData }: Route.ComponentProps) {
	return <>Account: {loaderData.accountId}</>
}
