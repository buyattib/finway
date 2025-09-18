import { Link, type LinkProps } from 'react-router'
import { FinhubIcon } from './finhub-icon'

export function FinhubLink(props: Pick<LinkProps, 'onClick'>) {
	return (
		<Link
			{...props}
			to='/app'
			className='flex items-center gap-2 font-semibold text-primary text-lg'
		>
			<FinhubIcon />
			Finhub
		</Link>
	)
}
