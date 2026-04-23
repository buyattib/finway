import { useEffect, useRef } from 'react'
import type { FetcherWithComponents } from 'react-router'
import type { SubmissionResult } from '@conform-to/react'

export function useFetcherSuccess(
	fetcher: FetcherWithComponents<{ submission?: SubmissionResult }>,
	onSuccess: () => void,
) {
	const phaseRef = useRef<'idle' | 'submitting' | 'loading'>('idle')

	useEffect(() => {
		if (fetcher.state === 'submitting') {
			phaseRef.current = 'submitting'
			return
		}

		if (fetcher.state === 'loading' && phaseRef.current === 'submitting') {
			phaseRef.current = 'loading'
			return
		}

		if (fetcher.state === 'idle') {
			if (phaseRef.current === 'loading' && !fetcher.data?.submission) {
				onSuccess()
			}
			phaseRef.current = 'idle'
			return
		}
	}, [fetcher.state, fetcher.data])
}
