import { useFetcher } from 'react-router'
import { TrashIcon } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'

import type { TMovementTab } from '../lib/types'

export function DeleteButton({
	movement,
	movementId,
	ariaLabel,
}: {
	movement: TMovementTab
	movementId: string
	ariaLabel: string
}) {
	const fetcher = useFetcher()
	const isDeleting = fetcher.state !== 'idle'
	return (
		<fetcher.Form
			method='post'
			action={`/app/movements/${movement}/${movementId}`}
		>
			<Button
				size='icon-xs'
				variant='destructive-ghost'
				type='submit'
				name='intent'
				value='delete'
				disabled={isDeleting}
			>
				{isDeleting ? (
					<Spinner aria-hidden size='sm' />
				) : (
					<TrashIcon aria-hidden />
				)}
				<span className='sr-only'>{ariaLabel}</span>
			</Button>
		</fetcher.Form>
	)
}
