import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
	data,
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRevalidator,
	useRouteError,
} from 'react-router'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { subscribeToSchemeChange } from '@epic-web/client-hints/color-scheme'

import type { Route } from './+types/root'

import {
	i18nextMiddleware,
	getLocale,
	getLocaleHeaders,
} from './middleware/i18next'

import { Toaster } from './components/ui/sonner'
import { useTheme } from './components/theme-toggle'
import { ShowToast } from './components/show-toast'
import { globalContext } from './lib/context'

import { getTheme } from './utils-server/theme.server'
import { honeypot } from './utils-server/honeypot.server'
import { getToast } from './utils-server/toast.server'
import { combineHeaders } from './utils-server/headers.server'

import { getServerT } from './utils-server/i18n.server'
import { getHints, getClientHintCheckScript } from './utils-client/client-hints'

import faviconAssetUrl from './assets/favicon.svg?url'
import fontsCssHref from './styles/fonts.css?url'
import tailwindCssHref from './styles/tailwind.css?url'

export const middleware = [i18nextMiddleware]

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

export function meta({ data, error }: Route.MetaArgs) {
	return [
		{
			title: !error
				? (data?.meta.title ?? 'Finway')
				: (data?.meta.errorTitle ?? 'Error | Finway'),
		},
		{
			property: 'og:title',
			content: data?.meta.title ?? 'Finway',
		},
		{
			name: 'description',
			content: data?.meta.description ?? 'The hub for your finances',
		},
	]
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const { cspNonce } = context.get(globalContext)
	const { toast, headers: toastHeaders } = await getToast(request)
	const locale = getLocale(context)
	const localeHeaders = await getLocaleHeaders(locale)
	const t = getServerT(context, 'components')

	return data(
		{
			locale,
			cspNonce,
			honeyProps: await honeypot.getInputProps(),
			toast,
			hints: getHints(),
			theme: await getTheme(request),
			meta: {
				title: t('root.meta.title'),
				errorTitle: t('root.meta.errorTitle'),
				description: t('root.meta.description'),
			},
		},
		{ headers: combineHeaders(toastHeaders, localeHeaders) },
	)
}

export default function App({ loaderData }: Route.ComponentProps) {
	const { i18n } = useTranslation()
	const theme = useTheme()

	const { locale, ...rest } = loaderData
	const nonce = rest?.cspNonce

	const { revalidate } = useRevalidator()
	useEffect(() => subscribeToSchemeChange(() => revalidate()), [revalidate])

	useEffect(() => {
		if (i18n.language !== locale) i18n.changeLanguage(locale)
	}, [locale, i18n])

	return (
		<html
			lang={i18n.language}
			dir={i18n.dir(i18n.language)}
			className={theme}
		>
			<head>
				<meta charSet='utf-8' />
				<meta
					name='viewport'
					content='width=device-width, initial-scale=1'
				/>

				<script
					nonce={nonce}
					dangerouslySetInnerHTML={{
						__html: getClientHintCheckScript(),
					}}
				/>
				<Meta />
				<Links />
			</head>
			<body className='min-h-svh flex flex-col w-full'>
				<HoneypotProvider {...loaderData.honeyProps}>
					<Outlet />
				</HoneypotProvider>

				<Toaster closeButton richColors position='bottom-right' />
				{loaderData?.toast ? <ShowToast {...loaderData.toast} /> : null}

				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
			</body>
		</html>
	)
}

export function ErrorBoundary() {
	const error = useRouteError()
	const { i18n, t } = useTranslation('components')

	let status = 500
	let message = t('root.error.unexpected')

	if (isRouteErrorResponse(error)) {
		status = error.status
		message =
			status === 404
				? t('root.error.notFound')
				: (error.data?.message ?? error.statusText)
	}

	return (
		<html lang={i18n.language}>
			<head>
				<meta charSet='utf-8' />
				<meta
					name='viewport'
					content='width=device-width, initial-scale=1'
				/>
				<Meta />
				<Links />
			</head>
			<body className='min-h-svh flex flex-col items-center justify-center w-full'>
				<div className='text-center space-y-2'>
					<h1 className='text-4xl font-bold'>{status}</h1>
					<p className='text-muted-foreground'>{message}</p>
				</div>
				<Scripts />
			</body>
		</html>
	)
}
