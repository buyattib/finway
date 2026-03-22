import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '~/lib/utils'

interface EmptyStateProps {
	icon: LucideIcon
	title: string
	description?: ReactNode
	action?: ReactNode
	className?: string
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center gap-4 py-12',
				className,
			)}
		>
			<div className='rounded-full bg-muted p-4'>
				<Icon className='size-8 text-muted-foreground' />
			</div>
			<div className='flex flex-col items-center gap-1 text-center'>
				<p className='text-lg font-semibold'>{title}</p>
				{description && (
					<p className='text-sm text-muted-foreground max-w-sm'>
						{description}
					</p>
				)}
			</div>
			{action && <div className='mt-2'>{action}</div>}
		</div>
	)
}
