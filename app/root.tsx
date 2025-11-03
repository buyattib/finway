import {
	data,
	// isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteLoaderData,
} from 'react-router'
import { HoneypotProvider } from 'remix-utils/honeypot/react'

import type { Route } from './+types/root'

import { Toaster } from './components/ui/sonner'
import { useTheme } from './components/theme-toggle'
import { ShowToast } from './components/show-toast'

import { globalContext } from './lib/context'
import { getTheme } from './utils/theme.server'
import { honeypot } from './utils/honeypot.server'
import { getToast } from './utils/toast.server'
import { combineHeaders } from './utils/headers.server'
import { getHints, ClientHintCheck } from './utils/client-hints'

import faviconAssetUrl from './assets/favicon.svg?url'
import fontsCssHref from './styles/fonts.css?url'
import tailwindCssHref from './styles/tailwind.css?url'

export const links: Route.LinksFunction = () => [
	{
		rel: 'preload',
		href: fontsCssHref,
		as: 'style',
	},
	{
		rel: 'preload',
		href: tailwindCssHref,
		as: 'style',
	},

	{
		rel: 'icon',
		type: 'image/svg+xml',
		href: faviconAssetUrl,
	},
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
	{
		rel: 'stylesheet',
		href: fontsCssHref,
	},
	{
		rel: 'stylesheet',
		href: tailwindCssHref,
	},
]

export function meta({ error }: Route.MetaArgs) {
	return [
		{ title: !error ? 'Finhub' : 'Error | Finhub' },
		{
			property: 'og:title',
			content: 'Finhub',
		},
		{
			name: 'description',
			content: 'The hub for your finances',
		},
	]
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const { cspNonce } = context.get(globalContext)
	const { toast, headers: toastHeaders } = await getToast(request)

	return data(
		{
			cspNonce,
			honeyProps: await honeypot.getInputProps(),
			toast,
			hints: getHints(),
			theme: await getTheme(request),
		},
		{ headers: combineHeaders(toastHeaders) },
	)
}

export default function App({ loaderData }: Route.ComponentProps) {
	return (
		<HoneypotProvider {...loaderData.honeyProps}>
			<Outlet />
		</HoneypotProvider>
	)
}

export function Layout({ children }: { children: React.ReactNode }) {
	const loaderData = useRouteLoaderData<typeof loader>('root')
	const nonce = loaderData?.cspNonce
	const theme = useTheme()

	return (
		<html lang='en' className={theme}>
			<head>
				<meta charSet='utf-8' />
				<meta
					name='viewport'
					content='width=device-width, initial-scale=1'
				/>

				<ClientHintCheck nonce={nonce} />
				<Meta />
				<Links />
			</head>
			<body className='min-h-svh flex flex-col w-full'>
				{children}

				<Toaster closeButton richColors position='bottom-right' />
				{loaderData?.toast ? <ShowToast {...loaderData.toast} /> : null}

				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
			</body>
		</html>
	)
}

// export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
// 	let message = 'Oops!'
// 	let details = 'An unexpected error occurred.'
// 	let stack: string | undefined

// 	if (isRouteErrorResponse(error)) {
// 		message = error.status === 404 ? '404' : 'Error'
// 		details =
// 			error.status === 404
// 				? 'The requested page could not be found.'
// 				: error.statusText || details
// 	} else if (import.meta.env.DEV && error && error instanceof Error) {
// 		details = error.message
// 		stack = error.stack
// 	}

// 	return (
// 		<main className='pt-16 p-4 container mx-auto'>
// 			<h1>{message}</h1>
// 			<p>{details}</p>
// 			{stack && (
// 				<pre className='w-full p-4 overflow-x-auto'>
// 					<code>{stack}</code>
// 				</pre>
// 			)}
// 		</main>
// 	)
// }
