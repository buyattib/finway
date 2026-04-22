import { useEffect, useRef } from 'react'
import type { FetcherWithComponents } from 'react-router'

export function useFetcherSuccess(
	fetcher: FetcherWithComponents<{ submission?: { status?: string } }>,
	onSuccess?: () => void,
) {
	const phaseRef = useRef<'idle' | 'submitting' | 'loading'>('idle')

	useEffect(() => {
		if (fetcher.state === 'submitting') {
			phaseRef.current = 'submitting'
		} else if (
			fetcher.state === 'loading' &&
			phaseRef.current === 'submitting'
		) {
			phaseRef.current = 'loading'
		} else if (fetcher.state === 'idle') {
			if (phaseRef.current === 'loading' && !fetcher.data?.submission) {
				onSuccess?.()
			}
			phaseRef.current = 'idle'
		}
	}, [fetcher.state, fetcher.data, onSuccess])
}
