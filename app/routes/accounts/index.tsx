import { Link } from 'react-router'
import { Button } from '~/components/ui/button'

export function meta() {
	return [
		{ title: 'Accounts | Finhub' },

		{
			property: 'og:title',
			content: 'Accounts | Finhub',
		},
		{
			name: 'description',
			content: 'Your accounts',
		},
	]
}

export async function loader() {
	return {}
}

export async function action() {}

export default function Accounts() {
	return (
		<>
			<Button asChild variant='link'>
				<Link to='create'>Create</Link>
			</Button>
		</>
	)
}
