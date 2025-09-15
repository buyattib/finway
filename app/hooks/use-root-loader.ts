import { useRouteLoaderData } from 'react-router'
import { type loader } from '~/root'

export function useRootLoader() {
	const rootLoader = useRouteLoaderData<typeof loader>('root')

	return rootLoader
}
