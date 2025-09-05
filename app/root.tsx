import {
	isRouteErrorResponse,
	Link,
	Links,
	Outlet,
	Scripts,
	ScrollRestoration,
	useNavigation,
} from 'react-router'
import type { Route } from './+types/root'
import { database } from '~/database/context'

import { useNonce } from './utils/nonce-provider'

import './styles/fonts.css'
import './styles/tailwind.css'

export const links: Route.LinksFunction = () => [
	{
		rel: 'preconnect',
		href: 'https://fonts.googleapis.com',
	},
	{
		rel: 'preconnect',
		href: 'https://fonts.gstatic.com',
		crossOrigin: 'anonymous',
	},
	{
		rel: 'stylesheet',
		href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
	},
]

export async function loader() {
	const db = database()
	const users = db.query.users.findMany({
		columns: {
			id: true,
			email: true,
		},
	})
	// console.log(users)
	return {}
}

export default function App() {
	return <Outlet />
}

export function Layout({ children }: { children: React.ReactNode }) {
	const navigation = useNavigation()
	const isNavigating = Boolean(navigation.location)

	const nonce = useNonce()

	return (
		<html lang='en'>
			<head>
				<title>Finhub</title>
				<meta name='description' content='The hub for your finances' />
				<meta name='robots' content='noindex, nofollow' />
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<Links />
			</head>
			<body>
				{isNavigating && 'Navigating...'}
				<Link to='/accounts'>Accounts</Link>
				<Link to='/'>Dashboard</Link>
				{children}
				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
			</body>
		</html>
	)
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = 'Oops!'
	let details = 'An unexpected error occurred.'
	let stack: string | undefined

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? '404' : 'Error'
		details =
			error.status === 404
				? 'The requested page could not be found.'
				: error.statusText || details
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message
		stack = error.stack
	}

	return (
		<main className='pt-16 p-4 container mx-auto'>
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className='w-full p-4 overflow-x-auto'>
					<code>{stack}</code>
				</pre>
			)}
		</main>
	)
}
