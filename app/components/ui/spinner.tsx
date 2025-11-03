import { Loader2Icon } from 'lucide-react'

import { cn } from '~/lib/utils'

type SpinnerProps = React.ComponentProps<'svg'> & { size?: 'sm' | 'md' | 'lg' }

function Spinner({ className, size = 'md', ...props }: SpinnerProps) {
	return (
		<Loader2Icon
			role='status'
			aria-label='Loading'
			className={cn(
				'animate-spin',
				{
					'size-4': size === 'sm',
					'size-6': size === 'md',
					'size-8': size === 'lg',
				},
				className,
			)}
			{...props}
		/>
	)
}

export { Spinner }
