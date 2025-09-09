import type { Route } from './+types/root'
import {
	data,
	isRouteErrorResponse,
	Links,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from 'react-router'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { parseWithZod } from '@conform-to/zod/v4'

import { useNonce } from './utils/nonce-provider'
import { honeypot } from './utils/honeypot'
import { themeCookie, getTheme, ThemeFormSchema, useTheme } from './utils/theme'

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

export async function loader({ request }: Route.LoaderArgs) {
	const honeyProps = await honeypot.getInputProps()
	const theme = await getTheme(request)
	return data({ honeyProps, theme })
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()

	if (formData.get('intent') !== 'theme-toggle') {
		return data({ status: 'error', submission: undefined }, { status: 400 })
	}

	const submission = await parseWithZod(formData, {
		schema: ThemeFormSchema,
		async: true,
	})

	if (submission.status !== 'success') {
		return data(
			{
				status: 'error',
				submission: submission.reply(),
			},
			{ status: 400 },
		)
	}

	return data(
		{
			status: 'success',
			submission: null,
		},
		{
			headers: {
				'Set-Cookie': await themeCookie.serialize(
					submission.value.theme,
				),
			},
		},
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
	const nonce = useNonce()
	const loaderData = useLoaderData<typeof loader>()
	const theme = useTheme(loaderData.theme)

	return (
		<html lang='en' className={theme}>
			<head>
				<title>Finhub</title>
				<meta name='description' content='The hub for your finances' />
				<meta name='robots' content='noindex, nofollow' />
				<meta charSet='utf-8' />
				<meta
					name='viewport'
					content='width=device-width, initial-scale=1'
				/>
				<Links />
			</head>
			<body className='min-h-svh flex flex-col w-full'>
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
