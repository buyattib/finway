import { cn } from '~/lib/utils'

export function FinwayIcon({ size = 'lg' }: { size?: 'md' | 'lg' }) {
	return (
		<img
			src='/app/assets/finway.svg'
			alt='Finway'
			className={cn({
				'w-8 h-8': size === 'md',
				'w-10 h-10': size === 'lg',
			})}
		/>
	)
}
