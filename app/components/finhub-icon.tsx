import { cn } from '~/lib/utils'

export function FinhubIcon({ size = 'lg' }: { size?: 'md' | 'lg' }) {
	return (
		<img
			src='app/assets/finhub.svg'
			alt='Finhub'
			className={cn({
				'w-8 h-8': size === 'md',
				'w-10 h-10': size === 'lg',
			})}
		/>
	)
}
