import { Link, type LinkProps } from 'react-router'
import { FinwayIcon } from './finway-icon'

export function FinwayLink(props: Pick<LinkProps, 'onClick'>) {
	return (
		<Link
			{...props}
			to='/app'
			className='flex items-center gap-2 font-semibold text-primary text-lg'
		>
			<FinwayIcon />
			Finway
		</Link>
	)
}
