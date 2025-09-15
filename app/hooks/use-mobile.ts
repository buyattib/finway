import * as React from 'react'
import { useRootLoader } from './use-root-loader'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
	const rootLoaderData = useRootLoader()
	const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
		rootLoaderData?.hints.isMobile,
	)

	React.useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
		const onChange = () => {
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
		}
		mql.addEventListener('change', onChange)
		setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
		return () => mql.removeEventListener('change', onChange)
	}, [])

	return !!isMobile
}
