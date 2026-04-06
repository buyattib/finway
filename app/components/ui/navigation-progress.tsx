import { useNavigation } from 'react-router'

import { cn } from '~/lib/utils'

export function NavigationProgress() {
	const navigation = useNavigation()
	const isLoading =
		navigation.state === 'loading' &&
		navigation.location &&
		!navigation.location.search

	return (
		<div
			role='progressbar'
			aria-hidden={!isLoading}
			className={cn(
				'fixed top-0 left-0 right-0 z-50 h-0.5 pointer-events-none',
				{ hidden: !isLoading },
			)}
		>
			<div className='h-full w-full bg-primary animate-progress origin-left' />
		</div>
	)
}
