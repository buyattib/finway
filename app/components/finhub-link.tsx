import { Link } from 'react-router'
import { FinhubIcon } from './finhub-icon'

export function FinhubLink() {
	return (
		<Link
			to='/'
			className='flex items-center gap-2 font-semibold text-primary text-lg'
		>
			<FinhubIcon />
			Finhub
		</Link>
	)
}
