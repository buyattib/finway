import { cn } from '~/lib/utils'
import finwaySvg from '~/assets/finway.svg'

export function FinwayIcon({ size = 'lg' }: { size?: 'md' | 'lg' }) {
	return (
		<img
			src={finwaySvg}
			alt='Finway'
			className={cn({
				'w-8 h-8': size === 'md',
				'w-10 h-10': size === 'lg',
			})}
		/>
	)
}
