import { useEffect, useRef } from 'react'
import { useNavigation } from 'react-router'

export function useFormSuccess(formAction: string, onSuccess?: () => void) {
	const navigation = useNavigation()
	const phaseRef = useRef<'idle' | 'submitting' | 'loading'>('idle')

	useEffect(() => {
		const isOurForm = navigation.formAction === formAction
		if (navigation.state === 'submitting' && isOurForm) {
			phaseRef.current = 'submitting'
		} else if (
			navigation.state === 'loading' &&
			phaseRef.current === 'submitting'
		) {
			phaseRef.current = 'loading'
		} else if (navigation.state === 'idle') {
			if (phaseRef.current === 'loading') {
				onSuccess?.()
			}
			phaseRef.current = 'idle'
		}
	}, [navigation.state, navigation.formAction, formAction, onSuccess])
}
