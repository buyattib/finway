import type { Route } from './+types/account'
// import { database } from '~/database/context'

export async function loader({ params }: Route.LoaderArgs) {
	// const db = database()
	// query
	return {}
}

export default function Account({ params }: Route.ComponentProps) {
	return <>Account: {params.accountId}</>
}
